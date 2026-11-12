"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { workflowExecutionChannel } from "@/inngest/channels/workflow-execution";
import { inngest } from "@/inngest/client";

export type WorkflowExecutionToken = Realtime.Token<
  typeof workflowExecutionChannel,
  ["status"]
>;

export async function fetchWorkflowExecutionRealtimeToken(): Promise<WorkflowExecutionToken> {
  return getSubscriptionToken(inngest, {
    channel: workflowExecutionChannel(),
    topics: ["status"],
  });
}
