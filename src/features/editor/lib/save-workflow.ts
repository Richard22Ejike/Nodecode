import type { ReactFlowInstance } from "@xyflow/react";

export function getWorkflowSavePayload(
  workflowId: string,
  editor: ReactFlowInstance,
) {
  const nodes = editor.getNodes();
  const edges = editor.getEdges();

  return {
    id: workflowId,
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data || {},
    })),
    edges: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    })),
  };
}
