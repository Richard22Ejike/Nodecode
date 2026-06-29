import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { NodeType } from "@/generated/prisma";
import { getExecutor } from "@/features/executions/lib/executor-regitry";

export const executeWorkflow = inngest.createFunction(
  { 
    id: "execute-workflow", 
    retries: 0 
  },
  async ({ event, step }) => {
    // Type assertion to access custom event data
    const eventData = event.data as { 
      workflowId: string; 
      initialData?: Record<string, unknown>;
    };
    
    const workflowId = eventData.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing");
    }

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: workflowId,
        },
        include: {
          nodes: true,
          connections: true,
        },
      });

      return topologicalSort(workflow.nodes, workflow.connections);
    });

    let context = eventData.initialData || {};

    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,

       publish: async () => { /* no-op */ },
      });
    }

    return { workflowId, result: context };
  }
);