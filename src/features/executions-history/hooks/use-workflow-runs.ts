import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

/** Recent runs of a workflow; polls quickly while one is live. */
export const useWorkflowRuns = (workflowId: string) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.executions.latestForWorkflow.queryOptions({
      workflowId,
      limit: 5,
    }),
    refetchInterval: (query) =>
      query.state.data?.some((run) => run.status === "RUNNING") ? 1500 : false,
  });
};

/** Stop the workflow's live run. */
export const useCancelRun = (workflowId: string) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.workflows.cancelRun.mutationOptions({
      onSuccess: () => {
        toast.success("Run stopped");
        queryClient.invalidateQueries(
          trpc.executions.latestForWorkflow.queryFilter({ workflowId }),
        );
      },
      onError: (error) => {
        toast.error(`Failed to stop run: ${error.message}`);
      },
    }),
  );
};
