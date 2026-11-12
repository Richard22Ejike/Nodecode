"use client";

import {
  BaseEdge,
  type Edge,
  type EdgeProps,
  getBezierPath,
} from "@xyflow/react";
import type { EdgePhase } from "@/features/executions/lib/execution-graph";

export type ExecutionEdgeData = {
  phase: EdgePhase;
};

const PHASE_STYLE: Record<
  EdgePhase,
  { stroke: string; strokeWidth: number; opacity: number; dash?: string }
> = {
  // Colours come from the palette tokens in globals.css (amber = live signal)
  runnable: {
    stroke: "var(--edge-runnable)",
    strokeWidth: 1.5,
    opacity: 0.85,
    dash: "5 6",
  },
  executing: {
    stroke: "var(--edge-active)",
    strokeWidth: 2.25,
    opacity: 1,
    dash: "8 10",
  },
  upcoming: {
    stroke: "var(--edge-active)",
    strokeWidth: 1.5,
    opacity: 0.6,
    dash: "5 9",
  },
  completed: { stroke: "var(--edge-done)", strokeWidth: 1.75, opacity: 0.95 },
  error: { stroke: "var(--edge-error)", strokeWidth: 1.75, opacity: 0.95 },
  idle: { stroke: "var(--edge-idle)", strokeWidth: 1.25, opacity: 0.45 },
};

export function ExecutionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<Edge<ExecutionEdgeData>>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const phase = data?.phase ?? "idle";
  const style = PHASE_STYLE[phase];
  const animated =
    phase === "runnable" || phase === "executing" || phase === "upcoming";
  const showParticles = phase === "executing" || phase === "upcoming";
  const duration =
    phase === "executing" ? "1.1s" : phase === "upcoming" ? "2s" : "3s";
  const pathId = `execution-edge-${id}`;
  const flowClass =
    phase === "executing"
      ? "execution-edge-flow execution-edge-flow--fast"
      : animated
        ? "execution-edge-flow"
        : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
          strokeDasharray: style.dash,
        }}
        className={flowClass}
      />
      {showParticles && (
        <>
          <path id={pathId} d={edgePath} fill="none" stroke="none" />
          <circle
            className="execution-edge-particle"
            r={phase === "executing" ? 3.5 : 2.5}
            style={{ fill: style.stroke, pointerEvents: "none" }}
          >
            <animateMotion
              dur={duration}
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </circle>
          {phase === "executing" && (
            <circle
              className="execution-edge-particle"
              r={2.5}
              style={{ fill: "var(--edge-active-soft)", pointerEvents: "none" }}
            >
              <animateMotion
                dur={duration}
                begin="0.35s"
                repeatCount="indefinite"
                rotate="auto"
              >
                <mpath href={`#${pathId}`} />
              </animateMotion>
            </circle>
          )}
        </>
      )}
    </>
  );
}
