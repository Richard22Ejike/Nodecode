import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export const useGenerateWorkflow = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.agent.generateWorkflow.mutationOptions({
      onError: (error) => {
        toast.error(`Agent failed: ${error.message}`);
      },
    }),
  );
};

export const useImportFromGithub = () => {
  const trpc = useTRPC();

  return useMutation(
    trpc.agent.importFromGithub.mutationOptions({
      onError: (error) => {
        toast.error(`Import failed: ${error.message}`);
      },
    }),
  );
};
