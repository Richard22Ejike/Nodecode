import { useAtomValue } from "jotai";
import type { NodeStatus } from "@/components/react-flow/node-status-indicator";
import { nodeStatusesAtom } from "@/features/executions/store/node-status-atoms";

interface UseNodeStatusOptions {
  nodeId: string;
  channel?: string;
  topic?: string;
  refreshToken?: () => Promise<unknown>;
}

// Status is written by the editor-level workflow subscription.
// These extra args are kept so existing node components do not need to change.
export function useNodeStatus({ nodeId }: UseNodeStatusOptions): NodeStatus {
  const statuses = useAtomValue(nodeStatusesAtom);
  return statuses[nodeId] ?? "initial";
}
