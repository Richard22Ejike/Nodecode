// src/features/editor/components/console/run-data.ts
import type { RunPlanEntry, RunStepRecord } from "@/features/executions/types";
import { BROWSER_SESSION_KEY } from "@/lib/browser-session-key";

export type RunStatus = "RUNNING" | "SUCCESS" | "FAILED";

export type StepState = "done" | "failed" | "running" | "pending";

export type ConsoleStep = {
  id: string;
  name: string;
  type: string;
  state: StepState;
  durationMs: number | null;
  output: Record<string, unknown> | null;
  error: string | null;
};

export type ConsoleRun = {
  id: string;
  status: RunStatus;
  startedAt: Date;
  error: string | null;
  steps: ConsoleStep[];
  /** Present once the run has finished and used a browser. */
  replaySessionId: string | null;
};

type RawRun = {
  id: string;
  status: RunStatus;
  startedAt: Date;
  error: string | null;
  output: unknown;
};

/** Turns a persisted Execution row into what the console renders. */
export function toConsoleRun(run: RawRun): ConsoleRun {
  const output = (run.output ?? {}) as Record<string, unknown>;
  const plan = (output._plan as RunPlanEntry[] | undefined) ?? [];
  const records =
    (output._steps as Record<string, RunStepRecord> | undefined) ?? {};

  let runningAssigned = false;
  const steps = plan.map((entry): ConsoleStep => {
    const record = records[entry.id];
    let state: StepState = "pending";
    if (record) {
      state = record.status === "failed" ? "failed" : "done";
    } else if (run.status === "RUNNING" && !runningAssigned) {
      // Nodes run strictly in plan order, so the first unrecorded one is live
      state = "running";
      runningAssigned = true;
    }
    return {
      id: entry.id,
      name: entry.name,
      type: entry.type,
      state,
      durationMs: record?.durationMs ?? null,
      output: record?.output ?? null,
      error: record?.error ?? null,
    };
  });

  const sessionId = output[BROWSER_SESSION_KEY];
  return {
    id: run.id,
    status: run.status,
    startedAt: new Date(run.startedAt),
    error: run.error,
    steps,
    replaySessionId:
      run.status !== "RUNNING" && typeof sessionId === "string"
        ? sessionId
        : null,
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}
