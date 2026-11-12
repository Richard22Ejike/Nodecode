import { agentRouter } from "@/features/agent/server/router";
import { credentialsRouter } from "@/features/credentials/server/router";
import { executionsRouter } from "@/features/executions-history/server/router";
import { workflowsRouter } from "@/features/workflows/server/router";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  credentials: credentialsRouter,
  executions: executionsRouter,
  agent: agentRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
