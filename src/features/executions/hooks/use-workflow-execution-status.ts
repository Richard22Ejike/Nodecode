"use client";

import { useInngestSubscription } from "@inngest/realtime/hooks";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { fetchWorkflowExecutionRealtimeToken } from "@/features/executions/actions";
import {
  executionGenerationAtom,
  nodeStatusesAtom,
} from "@/features/executions/store/node-status-atoms";

// Single editor-level subscription for every node's execution status.
// Per-node Inngest subscriptions were dropping the middle of the graph
// (browsers / the realtime hook cannot hold one live stream per node).
export function useWorkflowExecutionStatus() {
  const setNodeStatuses = useSetAtom(nodeStatusesAtom);
  const generation = useAtomValue(executionGenerationAtom);
  const ignoreUntilRef = useRef(0);
  const dataLengthRef = useRef(0);

  const { data } = useInngestSubscription({
    refreshToken: fetchWorkflowExecutionRealtimeToken,
    enabled: true,
    key: "workflow-execution",
  });

  dataLengthRef.current = data?.length ?? 0;

  // `generation` is intentionally a trigger-only dependency: each time it
  // changes we snapshot the current stream length so earlier messages are ignored.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on generation change
  useEffect(() => {
    ignoreUntilRef.current = dataLengthRef.current;
  }, [generation]);

  useEffect(() => {
    if (!data?.length) {
      return;
    }

    const latestByNode = new Map<string, NodeStatus>();
    const messages = data.slice(Math.min(ignoreUntilRef.current, data.length));
    for (const msg of messages) {
      if (msg.kind !== "data") continue;
      const nodeId = msg.data?.nodeId;
      const status = msg.data?.status as NodeStatus | undefined;
      if (!nodeId || !status) continue;
      latestByNode.set(nodeId, status);
    }

    if (!latestByNode.size) {
      return;
    }

    setNodeStatuses((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [nodeId, status] of latestByNode) {
        if (next[nodeId] !== status) {
          next[nodeId] = status;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data, setNodeStatuses]);
}
