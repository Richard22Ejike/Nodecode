// src/app/api/liveblocks-auth/route.ts
//
// Issues a Liveblocks token for one workflow room. The browser asks for a room,
// and we only grant it if the signed-in user may open that workflow (their own
// personal workflow, or one in their active Clerk organization).

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getLiveblocks, isLiveblocksConfigured } from "@/lib/liveblocks";
import { colorForUser, workflowIdFromRoom } from "@/lib/liveblocks-room";
import { workflowScope } from "@/lib/workflow-scope";

export async function POST(request: Request) {
  if (!isLiveblocksConfigured()) {
    return NextResponse.json(
      { error: "Multiplayer is not configured" },
      { status: 503 },
    );
  }

  const { userId, orgId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    room?: unknown;
  } | null;
  const workflowId =
    typeof body?.room === "string" ? workflowIdFromRoom(body.room) : null;
  if (!workflowId) {
    return NextResponse.json({ error: "Invalid room" }, { status: 400 });
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, ...workflowScope({ userId, orgId }) },
    select: { id: true },
  });
  if (!workflow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await currentUser();
  const name =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress ||
    "Someone";

  const session = getLiveblocks().prepareSession(userId, {
    userInfo: {
      name,
      avatar: user?.imageUrl,
      color: colorForUser(userId),
    },
  });
  session.allow(body?.room as string, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new NextResponse(token, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
