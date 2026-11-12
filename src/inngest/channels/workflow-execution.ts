import { channel, topic } from "@inngest/realtime";

export const WORKFLOW_EXECUTION_CHANNEL_NAME = "workflow-execution";

export const workflowExecutionChannel = channel(
  WORKFLOW_EXECUTION_CHANNEL_NAME,
).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
