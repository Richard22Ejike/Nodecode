// src/app/api/replays/[sessionId]/route.ts
//
// Proxies a Browserbase session recording (an HLS playlist) to the signed-in
// user. Fetching it needs the secret Browserbase API key, so it must go
// through the server, and it is only served for sessions that belong to one
// of the user's own workflow runs, since a replay shows whatever was on screen.

import Browserbase from "@browserbasehq/sdk";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { BROWSER_SESSION_KEY } from "@/lib/browser-session";
import prisma from "@/lib/db";
import { workflowScope } from "@/lib/workflow-scope";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const owned = await prisma.execution.findFirst({
    where: {
      workflow: workflowScope({ userId, orgId }),
      output: { path: [BROWSER_SESSION_KEY], equals: sessionId },
    },
    select: { id: true },
  });
  if (!owned) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pageIndex = Number.parseInt(
    new URL(request.url).searchParams.get("page") ?? "0",
    10,
  );

  const client = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

  try {
    const replay = await client.sessions.replays.retrieve(sessionId);
    const page = replay.pages[Number.isNaN(pageIndex) ? 0 : pageIndex];
    if (!page) {
      // The recording is finalised some time after the session closes
      return NextResponse.json({ status: "not-ready" }, { status: 202 });
    }

    const playlist = await client.sessions.replays.retrievePage(
      sessionId,
      page.pageId,
    );

    return new Response(await playlist.text(), {
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Cache-Control": "no-store",
        "X-Replay-Page-Count": String(replay.pageCount),
      },
    });
  } catch (error) {
    if (error instanceof Browserbase.NotFoundError) {
      return NextResponse.json({ status: "not-ready" }, { status: 202 });
    }
    console.error("Failed to load session replay:", error);
    return NextResponse.json(
      { error: "Failed to load replay" },
      { status: 502 },
    );
  }
}
