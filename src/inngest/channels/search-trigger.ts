// src/inngest/channels/search-trigger.ts
import { channel, topic } from "@inngest/realtime";

export const SEARCH_TRIGGER_CHANNEL_NAME = "search-trigger-execution";

export const searchTriggerChannel = channel(
  SEARCH_TRIGGER_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
