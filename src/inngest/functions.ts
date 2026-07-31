// src/inngest/functions.ts
import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import prisma from "@/lib/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { Realtime } from "@inngest/realtime";

// Define the event data type
interface ExecuteWorkflowEvent {
  workflowId: string;
  userId?: string;
  initialData?: Record<string, unknown>;
}

// Create a no-op publish function that matches the Realtime.PublishFn type
const createNoOpPublish = (): Realtime.PublishFn => {
  return async (message: any) => {
    // This is a no-op implementation
    return Promise.resolve();
  };
};

export const executeWorkflow = inngest.createFunction(
    { 
        id: "execute-workflow",
        retries: process.env.NODE_ENV === "production" ? 3 : 0,
        triggers: [{ event: "workflows/execute.workflow" }],
        onFailure: async ({ event, step }) => {
            return prisma.execution.update({
                where: { inngestEventId: event.data.event.id },
                data: {
                    status: ExecutionStatus.FAILED,
                    error: event.data.error.message,
                    errorStack: event.data.error.stack
                }
            });
        }
    },
    async ({ event, step }) => {
        const eventData = event.data as ExecuteWorkflowEvent;
        const inngestEventId = event.id;
        const workflowId = eventData.workflowId;

        if (!inngestEventId || !workflowId) {
            throw new NonRetriableError("Event ID or Workflow ID is missing");
        }

        // Create a Execution History Checkpoint
        await step.run("create-execution", async () => {
            return prisma.execution.create({
                data: {
                    workflowId,
                    inngestEventId
                }
            });
        });

        const sortedNodes = await step.run("prepare-workflow", async () => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: workflowId
                },
                include: {
                    nodes: true,
                    connections: true
                }
            });

            return topologicalSort(workflow.nodes, workflow.connections);
        });

        const userId = await step.run("find-user-id", async () => {
            const workflow = await prisma.workflow.findUniqueOrThrow({
                where: {
                    id: workflowId
                },
                select: {
                    userId: true
                }
            });
            return workflow.userId;
        });

        // Initialize the context with any initial data from the trigger
        let context = eventData.initialData || {};

        // Create a publish function that matches Realtime.PublishFn
        const publishFn: Realtime.PublishFn = createNoOpPublish();

        // Execute each node
        for (const node of sortedNodes) {
            const executor = getExecutor(node.type as NodeType);
            context = await executor({
                data: node.data as Record<string, unknown>,
                nodeId: node.id,
                userId,
                context,
                step,
                publish: publishFn
            });
        }

        // Update execution history with proper type casting
        await step.run("update-execution", async () => {
            return prisma.execution.update({
                where: { inngestEventId, workflowId },
                data: {
                    status: ExecutionStatus.SUCCESS,
                    completedAt: new Date(),
                    // Use as any to bypass the type check
                    // The data is already JSON-safe from the executor
                    output: context as any
                }
            });
        });

        return {
            workflowId,
            result: context
        };
    }
);