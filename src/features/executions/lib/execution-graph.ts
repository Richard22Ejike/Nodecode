import type { Edge, Node } from "@xyflow/react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { NodeType } from "@/generated/prisma/enums";

export type EdgePhase =
  | "runnable"
  | "executing"
  | "upcoming"
  | "completed"
  | "error"
  | "idle";

const TRIGGER_TYPES = new Set<string>([
  NodeType.MANUAL_TRIGGER,
  NodeType.GOOGLE_FORM_TRIGGER,
  NodeType.STRIPE_TRIGGER,
  NodeType.TELEGRAM,
  NodeType.WHATSAPP_TRIGGER,
]);

export function getReachableNodeIds(nodes: Node[], edges: Edge[]): Set<string> {
  const adjacency = new Map<string, string[]>();
  const incoming = new Set<string>();

  for (const edge of edges) {
    const next = adjacency.get(edge.source) ?? [];
    next.push(edge.target);
    adjacency.set(edge.source, next);
    incoming.add(edge.target);
  }

  const triggers = nodes.filter(
    (node) => node.type && TRIGGER_TYPES.has(node.type),
  );
  const starts = triggers.length
    ? triggers
    : nodes.filter(
        (node) => !incoming.has(node.id) && node.type !== NodeType.INITIAL,
      );

  const reachable = new Set<string>();
  const queue = starts.map((node) => node.id);

  for (const id of queue) {
    reachable.add(id);
  }

  while (queue.length) {
    const id = queue.shift();
    if (id === undefined) break;
    for (const next of adjacency.get(id) ?? []) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }

  return reachable;
}

export function getEdgePhase(
  sourceStatus: NodeStatus,
  targetStatus: NodeStatus,
  onPath: boolean,
  isRunning: boolean,
): EdgePhase {
  if (sourceStatus === "error" || targetStatus === "error") {
    return "error";
  }
  if (targetStatus === "loading") {
    return "executing";
  }
  if (sourceStatus === "success" && targetStatus === "success") {
    return "completed";
  }
  if (!isRunning) {
    return onPath ? "runnable" : "idle";
  }
  if (sourceStatus === "success" && targetStatus === "initial") {
    return "upcoming";
  }
  if (sourceStatus === "loading" && onPath) {
    return "upcoming";
  }
  if (onPath && isRunning) {
    return "upcoming";
  }
  if (onPath) {
    return "runnable";
  }
  return "idle";
}
