import { createTRPCRouter } from "../init";
import { workflowsRouter } from "@/features/workflows/server/routers";
import {
   baseProcedure

} from "@/trpc/init";
export const appRouter = createTRPCRouter({
  workflows: workflowsRouter,
  testAi: baseProcedure
    .mutation(async () => {
      // Your AI test logic here
      return { success: true };
    }),
});

export type AppRouter = typeof appRouter;
