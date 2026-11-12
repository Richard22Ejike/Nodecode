// src/inngest/channels/script.ts
import { channel, topic } from "@inngest/realtime";

export const SCRIPT_CHANNEL_NAME = "script-execution";

export const scriptChannel = channel(SCRIPT_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
