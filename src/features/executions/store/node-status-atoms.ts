import { atom } from "jotai";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";

// Live status of every node in the current execution, keyed by node id.
// Written by useNodeStatus (each node syncs its realtime status here) and
// read by the editor to animate the edges along the execution path.
export const nodeStatusesAtom = atom<Record<string, NodeStatus>>({});

// Bumped at the start of each run so node subscriptions ignore stale
// realtime messages from the previous execution.
export const executionGenerationAtom = atom(0);
