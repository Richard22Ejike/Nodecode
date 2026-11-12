// src/inngest/functions.ts

import type { Realtime } from "@inngest/realtime";
import { NonRetriableError } from "inngest";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { RunPlanEntry, RunStepRecord } from "@/features/executions/types";
import type { Prisma } from "@/generated/prisma/client";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { workflowExecutionChannel } from "@/inngest/channels/workflow-execution";
import {
  BROWSER_SESSION_KEY,
  releaseBrowserSession,
} from "@/lib/browser-session";
import prisma from "@/lib/db";
import { inngest } from "./client";
import { topologicalSort } from "./utils";

interface ExecuteWorkflowEvent {
  workflowId: string;
  userId?: string;
  initialData?: Record<string, unknown>;
}

// Executors return the whole context; a node's own output is what it added or changed.
const changedVariables = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(after).filter(
      ([key, value]) =>
        !key.startsWith("_") &&
        JSON.stringify(before[key]) !== JSON.stringify(value),
    ),
  );

const createRealtimePublish = (): Realtime.PublishFn => {
  return async (message) => {
    const resolved = await message;
    try {
      await inngest.realtime.publish(
        {
          channel: resolved.channel,
          topic: resolved.topic,
        } as never,
        resolved.data,
      );
    } catch (error) {
      console.warn("Failed to publish node status:", error);
    }
    return resolved.data;
  };
};

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    // Stop button: cancels every live run of the same workflow
    cancelOn: [
      { event: "workflows/cancel.workflow", match: "data.workflowId" },
    ],
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    triggers: [{ event: "workflows/execute.workflow" }],
    onFailure: async ({ event }) => {
      console.log("💀 Workflow failed:", event.data.error);
      return prisma.execution.update({
        where: { inngestEventId: event.data.event.id },
        data: {
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        },
      });
    },
  },
  async ({ event, step }) => {
    const eventData = event.data as ExecuteWorkflowEvent;
    const inngestEventId = event.id;
    const workflowId = eventData.workflowId;

    console.log(`🚀 Starting workflow execution: ${workflowId}`);
    console.log(`📦 Event data:`, eventData);

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or Workflow ID is missing");
    }

    // Create execution record
    await step.run("create-execution", async () => {
      console.log(`📝 Creating execution record for workflow: ${workflowId}`);
      return prisma.execution.create({
        data: {
          workflowId,
          inngestEventId,
          startedAt: new Date(),
        },
      });
    });

    // Get sorted nodes with their execution order
    const sortedNodes = await step.run("prepare-workflow", async () => {
      console.log(`📋 Preparing workflow: ${workflowId}`);

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      console.log(`📊 Found ${workflow.nodes.length} nodes in workflow`);
      console.log(
        `🔗 Found ${workflow.connections.length} connections in workflow`,
      );

      const sorted = topologicalSort(workflow.nodes, workflow.connections);

      // Log detailed execution order
      console.log(`📋 Execution order for workflow ${workflowId}:`);
      sorted.forEach((node, index) => {
        console.log(`  ${index + 1}. ${node.type} (ID: ${node.id})`);
        console.log(`     Data:`, node.data);
      });

      return sorted;
    });

    const userId = await step.run("find-user-id", async () => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        select: { userId: true },
      });
      console.log(`👤 Found userId: ${workflow.userId}`);
      return workflow.userId;
    });

    // Initialize context
    let context: Record<string, unknown> = eventData.initialData || {};
    console.log(`📦 Initial context:`, context);

    const publishFn: Realtime.PublishFn = createRealtimePublish();

    const publishNodeStatus = async (
      nodeId: string,
      status: "loading" | "success" | "error",
    ) => {
      await publishFn(workflowExecutionChannel().status({ nodeId, status }));
    };

    // The ordered plan is persisted up front so the console can list every
    // step (including ones that have not run yet) as soon as the run starts.
    const plan: RunPlanEntry[] = sortedNodes.map((n) => ({
      id: n.id,
      type: n.type as string,
      name: n.name,
    }));
    const steps: Record<string, RunStepRecord> = {};

    const buildOutput = (extra: Record<string, unknown> = {}) =>
      ({
        ...context,
        _plan: plan,
        _steps: steps,
        ...extra,
      }) as Prisma.InputJsonValue;

    await step.run("record-plan", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: { output: buildOutput() },
      });
    });

    // The run's shared browser must be released when the run ends (success or
    // failure) so it stops billing and its recording is finalised for replay.
    const releaseBrowser = async (label: string) => {
      const sessionId = context[BROWSER_SESSION_KEY];
      if (typeof sessionId !== "string" || !sessionId) return;
      await step.run(`release-browser-session-${label}`, async () => {
        try {
          await releaseBrowserSession(sessionId);
        } catch (releaseError) {
          console.warn("Failed to release browser session:", releaseError);
        }
      });
    };

    // Execute each node in order
    for (let i = 0; i < sortedNodes.length; i++) {
      const node = sortedNodes[i];
      const nodeType = node.type as NodeType;
      // Timestamps come out of memoised step results: plain Date.now() in
      // function code would be re-evaluated on every Inngest replay.
      let startedAt: number | null = null;

      console.log(
        `🔄 [${i + 1}/${sortedNodes.length}] Executing node: ${nodeType} (${node.id})`,
      );

      try {
        const executor = getExecutor(nodeType);

        if (nodeType !== NodeType.INITIAL) {
          startedAt = await step.run(`status-loading-${node.id}`, async () => {
            await publishNodeStatus(node.id, "loading");
            return Date.now();
          });
        }

        const contextBefore = { ...context };

        const result = await executor({
          data: node.data as Record<string, unknown>,
          nodeId: node.id,
          userId,
          context,
          step,
          publish: publishFn,
        });

        // Executors return the whole context; keep only what this node added
        const output = changedVariables(contextBefore, result);

        context = {
          ...context,
          ...result,
          [`_node_${node.id}_output`]: output,
          _last_executed_node: node.id,
          [`_node_${node.id}_type`]: nodeType,
        };

        let endedAt: number | null = startedAt;
        if (nodeType !== NodeType.INITIAL) {
          endedAt = await step.run(`status-success-${node.id}`, async () => {
            await publishNodeStatus(node.id, "success");
            return Date.now();
          });
        }

        steps[node.id] = {
          type: nodeType,
          name: node.name,
          status: "success",
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          durationMs: startedAt && endedAt ? endedAt - startedAt : null,
          output,
          error: null,
        };

        await step.run(`update-progress-${node.id}`, async () => {
          return prisma.execution.update({
            where: { inngestEventId, workflowId },
            data: {
              output: buildOutput({
                _progress: {
                  current: i + 1,
                  total: sortedNodes.length,
                  currentNode: node.id,
                  nodeType: nodeType,
                  completedNodes: sortedNodes.slice(0, i + 1).map((n) => n.id),
                },
              }),
            },
          });
        });
      } catch (error) {
        console.error(`❌ Node ${node.id} (${nodeType}) failed:`, error);
        const message = error instanceof Error ? error.message : String(error);

        let endedAt: number | null = null;
        if (nodeType !== NodeType.INITIAL) {
          endedAt = await step.run(`status-error-${node.id}`, async () => {
            await publishNodeStatus(node.id, "error");
            return Date.now();
          });
        }

        steps[node.id] = {
          type: nodeType,
          name: node.name,
          status: "failed",
          startedAt: startedAt ? new Date(startedAt).toISOString() : null,
          durationMs: startedAt && endedAt ? endedAt - startedAt : null,
          output: null,
          error: message,
        };

        await releaseBrowser(`error-${node.id}`);

        await step.run(`update-error-${node.id}`, async () => {
          return prisma.execution.update({
            where: { inngestEventId, workflowId },
            data: {
              status: ExecutionStatus.FAILED,
              completedAt: new Date(),
              error: message,
              errorStack: error instanceof Error ? error.stack : undefined,
              output: buildOutput({
                _failedNode: { id: node.id, type: nodeType, error: message },
              }),
            },
          });
        });

        throw error;
      }
    }

    await releaseBrowser("done");

    console.log(`🎉 Workflow ${workflowId} completed successfully!`);
    console.log(`📊 Executed ${sortedNodes.length} nodes total`);
    console.log(`📦 Final context:`, context);

    await releaseBrowser("done");

    await step.run("update-execution-success", async () => {
      return prisma.execution.update({
        where: { inngestEventId, workflowId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: {
            ...context,
            _plan: plan,
            _steps: steps,
            _executionSummary: {
              totalNodes: sortedNodes.length,
              completedAt: new Date().toISOString(),
            },
          } as Prisma.InputJsonValue,
        },
      });
    });

    return {
      workflowId,
      result: context,
      nodeCount: sortedNodes.length,
      steps,
    };
  },
);
