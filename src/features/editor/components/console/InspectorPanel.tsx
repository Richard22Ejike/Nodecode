// src/features/editor/components/console/InspectorPanel.tsx
"use client";

import type { ConsoleSelection } from "./LogsPanel";
import type { ConsoleRun } from "./run-data";
import { SessionReplay } from "./SessionReplay";

export function InspectorPanel({
  run,
  selection,
}: {
  run: ConsoleRun;
  selection: ConsoleSelection;
}) {
  if (selection.kind === "replay" && run.replaySessionId) {
    return (
      <SessionReplay
        key={run.replaySessionId}
        sessionId={run.replaySessionId}
      />
    );
  }

  const step =
    selection.kind === "step"
      ? run.steps.find((candidate) => candidate.id === selection.nodeId)
      : undefined;

  if (!step) return null;

  return (
    <div className="h-full overflow-auto bg-card p-3 text-sm">
      <p className="mb-2 font-medium tracking-[-0.01em]">{step.name}</p>
      {step.error ? (
        <pre className="whitespace-pre-wrap break-words rounded-md border border-destructive/30 bg-destructive/10 p-3 font-mono text-xs text-destructive">
          {step.error}
        </pre>
      ) : step.output && Object.keys(step.output).length > 0 ? (
        <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted p-3 font-mono text-xs">
          {JSON.stringify(step.output, null, 2)}
        </pre>
      ) : step.state === "done" ? (
        <p className="text-muted-foreground">This step produced no output.</p>
      ) : step.state === "running" ? (
        <p className="text-muted-foreground">This step is running…</p>
      ) : (
        <p className="text-muted-foreground">This step hasn&apos;t run yet.</p>
      )}
    </div>
  );
}
