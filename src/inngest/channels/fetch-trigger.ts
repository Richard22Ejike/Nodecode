// src/inngest/channels/fetch-trigger.ts
import { channel, topic } from "@inngest/realtime";

export const FETCH_TRIGGER_CHANNEL_NAME = "fetch-trigger-execution";

export const fetchTriggerChannel = channel(FETCH_TRIGGER_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
