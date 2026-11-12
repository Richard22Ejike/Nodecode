"use client";

import { type Edge, MarkerType, type Node } from "@xyflow/react";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import type { ExecutionEdgeData } from "@/features/editor/components/ExecutionEdge";
import {
  getEdgePhase,
  getReachableNodeIds,
} from "@/features/executions/lib/execution-graph";
import { nodeStatusesAtom } from "@/features/executions/store/node-status-atoms";

export function useExecutionGraph(nodes: Node[], edges: Edge[]) {
  const statuses = useAtomValue(nodeStatusesAtom);

  const reachable = useMemo(
    () => getReachableNodeIds(nodes, edges),
    [nodes, edges],
  );

  const isRunning = useMemo(
    () => Object.values(statuses).some((status) => status === "loading"),
    [statuses],
  );

  const decoratedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const status = statuses[node.id] ?? "initial";
        const onPath = reachable.has(node.id);
        const classNames = [
          status === "loading" ? "execution-node--running" : "",
          status === "success" ? "execution-node--success" : "",
          status === "error" ? "execution-node--error" : "",
          !onPath ? "execution-node--off-path" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return classNames ? { ...node, className: classNames } : node;
      }),
    [nodes, reachable, statuses],
  );

  const decoratedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const onPath = reachable.has(edge.source) && reachable.has(edge.target);
        const phase = getEdgePhase(
          statuses[edge.source] ?? "initial",
          statuses[edge.target] ?? "initial",
          onPath,
          isRunning,
        );

        return {
          ...edge,
          type: "execution",
          animated: false,
          zIndex: phase === "executing" ? 4 : phase === "upcoming" ? 3 : 1,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color:
              phase === "completed"
                ? "#22c55e"
                : phase === "error"
                  ? "#ef4444"
                  : phase === "executing"
                    ? "#3b82f6"
                    : phase === "idle"
                      ? "#475569"
                      : "#64748b",
          },
          data: {
            ...(edge.data ?? {}),
            phase,
          } satisfies ExecutionEdgeData,
        };
      }),
    [edges, isRunning, reachable, statuses],
  );

  return { decoratedNodes, decoratedEdges };
}
