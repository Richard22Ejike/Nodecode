import type { inferInput } from "@trpc/tanstack-react-query";
import { prefetch, trpc } from "@/trpc/server";

// Infer Input Type for TRPC Procedure
type Input = inferInput<typeof trpc.executions.getMany>;

// Prefetch all Executions
export const prefetchExecutions = (params: Input) => {
  return prefetch(trpc.executions.getMany.queryOptions(params));
};

// Prefetch a single Execution
export const prefetchExecution = (id: string) => {
  return prefetch(trpc.executions.getOne.queryOptions({ id }));
};
