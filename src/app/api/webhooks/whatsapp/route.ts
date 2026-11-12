import { type NextRequest, NextResponse } from "next/server";
import { NodeType } from "@/generated/prisma/enums";
import { sendWorkflowExecution } from "@/inngest/utils";
import prisma from "@/lib/db";

export const runtime = "nodejs";

type WhatsAppChangeValue = {
  messages?: Array<{
    from?: string;
    id?: string;
    timestamp?: string;
    type?: string;
    text?: { body?: string };
  }>;
  contacts?: Array<{
    wa_id?: string;
    profile?: { name?: string };
  }>;
};

function extractIncomingMessage(payload: Record<string, unknown>) {
  const entry = Array.isArray(payload.entry) ? payload.entry : [];
  for (const item of entry) {
    const changes = Array.isArray((item as { changes?: unknown }).changes)
      ? (item as { changes: Array<{ value?: WhatsAppChangeValue }> }).changes
      : [];
    for (const change of changes) {
      const value = change.value;
      const message = value?.messages?.[0];
      if (!message) continue;
      const contact = value?.contacts?.[0];
      return {
        text: message.text?.body ?? "",
        from: message.from ?? contact?.wa_id ?? "",
        chatId: message.from ?? contact?.wa_id ?? "",
        contactName: contact?.profile?.name ?? "",
        messageId: message.id ?? "",
        messageType: message.type ?? "text",
      };
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const workflowId = url.searchParams.get("workflowId");

  if (mode !== "subscribe" || !token || !challenge) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  let expected = process.env.WHATSAPP_VERIFY_TOKEN || "";
  if (workflowId) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { nodes: { where: { type: NodeType.WHATSAPP_TRIGGER } } },
    });
    const nodeToken = (
      workflow?.nodes[0]?.data as { verifyToken?: string } | null
    )?.verifyToken;
    if (nodeToken) {
      expected = nodeToken;
    }
  }

  if (!expected || token !== expected) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const workflowId = url.searchParams.get("workflowId") || "";
    const payload = (await request.json()) as Record<string, unknown>;
    const incoming = extractIncomingMessage(payload);

    if (!workflowId || !incoming?.text || !incoming.chatId) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    queueMicrotask(async () => {
      try {
        await sendWorkflowExecution({
          workflowId,
          initialData: {
            workflowId,
            source: "whatsapp",
            text: incoming.text,
            chatId: incoming.chatId,
            from: incoming.from,
            contactName: incoming.contactName,
            messageId: incoming.messageId,
            whatsapp: payload,
          },
        });
      } catch (error) {
        console.error("WhatsApp workflow execution failed:", error);
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
