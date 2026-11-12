import { useAtomValue } from "jotai";
import { editorAtom } from "@/features/editor/store/atoms";
import { useUpdateWorkflow } from "@/features/workflows/hooks/use-workflows";

type PlanNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

type PlanEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
};

// Applies an agent-generated plan to the canvas and persists it so
// execution sees the generated configuration.
export const useApplyWorkflowPlan = (workflowId: string) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();

  const applyPlan = async ({
    nodes,
    edges,
  }: {
    nodes: PlanNode[];
    edges: PlanEdge[];
  }) => {
    if (!editor) return false;

    editor.setNodes(nodes);
    editor.setEdges(edges);

    await saveWorkflow.mutateAsync({
      id: workflowId,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      })),
    });

    // Let React Flow apply the queued node changes before fitting the view
    setTimeout(() => editor.fitView({ padding: 0.2 }), 100);
    return true;
  };

  return {
    applyPlan,
    isSaving: saveWorkflow.isPending,
    editorReady: !!editor,
  };
};
