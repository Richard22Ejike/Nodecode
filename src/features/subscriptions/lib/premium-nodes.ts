// src/features/subscriptions/lib/premium-nodes.ts
import { NodeType } from "@/generated/prisma/enums";

/** Node types that need the Pro plan. Every other node stays free. */
export const PREMIUM_NODE_TYPES: ReadonlySet<string> = new Set([
  NodeType.AGENT,
]);

export const isPremiumNodeType = (type: string): boolean =>
  PREMIUM_NODE_TYPES.has(type);
