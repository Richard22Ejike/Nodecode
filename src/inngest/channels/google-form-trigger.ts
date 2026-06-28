import { channel, topic } from "@inngest/realtime";

export const GOOGLE_FORML_TRIGGER_CHANNEL_NAME =
  "google-form-trigger-execution";

export const googleFormTriggerChannel = channel(
  GOOGLE_FORML_TRIGGER_CHANNEL_NAME
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>()
);
