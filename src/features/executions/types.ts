// src/features/executions/types.ts
import type { Realtime } from "@inngest/realtime";
import type { GetStepTools, Inngest } from "inngest";

export type WorkflowContext = Record<string, unknown>;

export type StepTools = GetStepTools<Inngest.Any>;

export interface NodeExecutorParams<TData = Record<string, unknown>> {
  data: TData;
  nodeId: string;
  userId: string;
  context: WorkflowContext;
  step: StepTools;
  publish: Realtime.PublishFn;
}

// Make NodeExecutor generic
export type NodeExecutor<TData = Record<string, unknown>> = (
  params: NodeExecutorParams<TData>,
) => Promise<WorkflowContext>;

/** One entry of a run's ordered execution plan (persisted in Execution.output._plan). */
export type RunPlanEntry = { id: string; type: string; name: string };

/** What a single node did during a run (Execution.output._steps[nodeId]). */
export type RunStepRecord = {
  type: string;
  name: string;
  status: "success" | "failed";
  startedAt: string | null;
  durationMs: number | null;
  /** Only the variables this node added or changed, not the whole run context. */
  output: Record<string, unknown> | null;
  error: string | null;
};
