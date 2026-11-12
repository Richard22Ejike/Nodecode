import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { FlaskConicalIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWorkflowSavePayload } from "@/features/editor/lib/save-workflow";
import { editorAtom } from "@/features/editor/store/atoms";
import {
  useCancelRun,
  useWorkflowRuns,
} from "@/features/executions-history/hooks/use-workflow-runs";
import {
  useExecuteWorkflow,
  useUpdateWorkflow,
} from "@/features/workflows/hooks/use-workflows";
import { useTRPC } from "@/trpc/client";

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const editor = useAtomValue(editorAtom);
  const executeWorkflow = useExecuteWorkflow();
  const saveWorkflow = useUpdateWorkflow();
  const { data: runs } = useWorkflowRuns(workflowId);
  const cancelRun = useCancelRun(workflowId);
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const isLive = runs?.some((run) => run.status === "RUNNING") ?? false;

  // A run's record is created a moment after the event is sent, so re-check
  // shortly after starting so the button flips to Stop promptly.
  const refreshRunsSoon = () => {
    for (const delay of [1000, 3000, 6000]) {
      setTimeout(
        () =>
          queryClient.invalidateQueries(
            trpc.executions.latestForWorkflow.queryFilter({ workflowId }),
          ),
        delay,
      );
    }
  };

  const handleExecute = async () => {
    if (!editor) {
      return;
    }

    try {
      await saveWorkflow.mutateAsync(
        getWorkflowSavePayload(workflowId, editor),
      );
      executeWorkflow.mutate(
        { id: workflowId },
        { onSuccess: refreshRunsSoon },
      );
    } catch {
      // Save errors are surfaced by useUpdateWorkflow
    }
  };

  if (isLive) {
    return (
      <Button
        type="button"
        size="lg"
        variant="destructive"
        onClick={() => cancelRun.mutate({ id: workflowId })}
        disabled={cancelRun.isPending}
      >
        <SquareIcon className="size-4" />
        Stop
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      onClick={handleExecute}
      disabled={saveWorkflow.isPending || executeWorkflow.isPending}
    >
      <FlaskConicalIcon className="size-4" />
      Execute Workflow
    </Button>
  );
};
