// src/features/editor/components/console/LogsPanel.tsx
"use client";

import {
  CheckCircle2Icon,
  CircleDashedIcon,
  Loader2Icon,
  PlayCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { findNodeOption } from "@/components/node-selector";
import { logoClass } from "@/lib/logo-class";
import { cn } from "@/lib/utils";
import {
  type ConsoleRun,
  type ConsoleStep,
  formatDuration,
  type StepState,
} from "./run-data";

export type ConsoleSelection =
  | { runId: string; kind: "step"; nodeId: string }
  | { runId: string; kind: "replay" };

const STATE_ICON: Record<StepState, React.ReactNode> = {
  done: <CheckCircle2Icon className="size-4 text-success" />,
  failed: <XCircleIcon className="size-4 text-destructive" />,
  running: <Loader2Icon className="size-4 animate-spin text-signal" />,
  pending: <CircleDashedIcon className="size-4 text-muted-foreground/60" />,
};

function NodeGlyph({ type }: { type: string }) {
  const option = findNodeOption(type);
  const Icon = option?.icon;
  if (!Icon) return <span className="size-4" />;
  if (typeof Icon === "string") {
    return (
      // biome-ignore lint/performance/noImgElement: local SVG logos gain nothing from next/image
      <img
        src={Icon}
        alt=""
        className={cn("size-4 object-contain", logoClass(Icon))}
      />
    );
  }
  return <Icon className="size-4 text-muted-foreground" />;
}

function Row({
  selected,
  inactive,
  onClick,
  children,
}: {
  selected: boolean;
  inactive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1 text-left text-[13px] outline-none transition-colors duration-150 hover:bg-accent/70 focus-visible:ring-2 focus-visible:ring-ring/60",
        selected &&
          "bg-accent text-accent-foreground ring-1 ring-inset ring-border",
        inactive && "opacity-50",
      )}
    >
      {children}
    </button>
  );
}

function StepRow({
  step,
  selected,
  onSelect,
}: {
  step: ConsoleStep;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Row
      selected={selected}
      inactive={step.state === "pending"}
      onClick={onSelect}
    >
      {STATE_ICON[step.state]}
      <NodeGlyph type={step.type} />
      <span className="flex-1 truncate">{step.name}</span>
      {step.durationMs !== null && (
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {formatDuration(step.durationMs)}
        </span>
      )}
    </Row>
  );
}

export function LogsPanel({
  runs,
  selection,
  onSelect,
}: {
  runs: ConsoleRun[];
  selection: ConsoleSelection | null;
  onSelect: (selection: ConsoleSelection) => void;
}) {
  if (runs.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
        No runs yet. Execute the workflow to see each step here.
      </div>
    );
  }

  return (
    <div className="h-full space-y-4 overflow-auto p-2">
      {runs.map((run) => (
        <div key={run.id} className="space-y-0.5">
          <div className="flex items-center justify-between border-b px-2 pb-1.5 font-mono text-[11px] text-muted-foreground tabular-nums">
            <span>
              Run · {run.startedAt.toLocaleTimeString()} ·{" "}
              {run.status.toLowerCase()}
            </span>
          </div>
          {run.steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              selected={
                selection?.runId === run.id &&
                selection.kind === "step" &&
                selection.nodeId === step.id
              }
              onSelect={() =>
                onSelect({ runId: run.id, kind: "step", nodeId: step.id })
              }
            />
          ))}
          {run.replaySessionId && (
            <Row
              selected={
                selection?.runId === run.id && selection.kind === "replay"
              }
              onClick={() => onSelect({ runId: run.id, kind: "replay" })}
            >
              <PlayCircleIcon className="size-4 text-signal" />
              <span className="flex-1">Replay</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                whole run
              </span>
            </Row>
          )}
        </div>
      ))}
    </div>
  );
}
