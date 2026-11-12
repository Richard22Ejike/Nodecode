// src/inngest/channels/browse-trigger.ts
import { channel, topic } from "@inngest/realtime";

export const BROWSE_TRIGGER_CHANNEL_NAME = "browse-trigger-execution";

export const browseTriggerChannel = channel(
  BROWSE_TRIGGER_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
    message?: string;
  }>(),
);

// Export the status topic directly
export const browseTriggerStatus = browseTriggerChannel.topics.status;
