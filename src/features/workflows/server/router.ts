// src/features/workflows/server/router.ts

import { auth } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import type { Edge, Node } from "@xyflow/react";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { isPremiumNodeType } from "@/features/subscriptions/lib/premium-nodes";
import { ExecutionStatus, NodeType } from "@/generated/prisma/enums";
import { inngest } from "@/inngest/client";
import { sendWorkflowExecution } from "@/inngest/utils";
import {
  BROWSER_SESSION_KEY,
  releaseBrowserSession,
} from "@/lib/browser-session";
import prisma from "@/lib/db";
import { deleteWorkflowRoom, workflowRoomId } from "@/lib/liveblocks";
import { newWorkflowOwner, workflowScope } from "@/lib/workflow-scope";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

// Define the position type
type Position = { x: number; y: number };

// Helper function to safely parse position from JsonValue
const parsePosition = (position: unknown): Position => {
  if (typeof position === "object" && position !== null) {
    const pos = position as Record<string, unknown>;
    if (typeof pos.x === "number" && typeof pos.y === "number") {
      return { x: pos.x, y: pos.y };
    }
  }
  return { x: 0, y: 0 }; // Default fallback
};

export const workflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          ...workflowScope(ctx.auth),
        },
      });

      // Premium nodes (e.g. Agent) only run for Pro users. Checked here, not
      // just in the picker, so a workflow saved earlier can't bypass the lock.
      const nodes = await prisma.node.findMany({
        where: { workflowId: input.id },
        select: { type: true },
      });
      if (nodes.some((node) => isPremiumNodeType(node.type))) {
        const { has } = await auth();
        if (!has({ plan: "pro" })) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "The Agent node requires the Pro plan.",
          });
        }
      }

      await sendWorkflowExecution({
        workflowId: input.id,
      });

      return workflow;
    }),
  /** Stop the workflow's live run: cancel it in Inngest and close its browser. */
  cancelRun: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, ...workflowScope(ctx.auth) },
        select: { id: true },
      });

      const running = await prisma.execution.findMany({
        where: { workflowId: input.id, status: ExecutionStatus.RUNNING },
        select: { id: true, output: true },
      });

      // Stops further steps from being scheduled
      await inngest.send({
        name: "workflows/cancel.workflow",
        data: { workflowId: input.id },
      });

      // A step that is already executing can't be interrupted, but closing its
      // browser makes a long-running browser step fail fast instead.
      for (const execution of running) {
        const output = execution.output as Record<string, unknown> | null;
        const sessionId = output?.[BROWSER_SESSION_KEY];
        if (typeof sessionId === "string") {
          await releaseBrowserSession(sessionId).catch(() => {});
        }
      }

      await prisma.execution.updateMany({
        where: { workflowId: input.id, status: ExecutionStatus.RUNNING },
        data: {
          status: ExecutionStatus.FAILED,
          error: "Cancelled by user",
          completedAt: new Date(),
        },
      });

      return { cancelled: running.length };
    }),
  create: protectedProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        ...newWorkflowOwner(ctx.auth),
        nodes: {
          create: {
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
            name: NodeType.INITIAL,
          },
        },
      },
    });
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await prisma.workflow.delete({
        where: {
          id: input.id,
          ...workflowScope(ctx.auth),
        },
      });
      // Don't leave the multiplayer room (and its stored canvas) behind
      await deleteWorkflowRoom(workflowRoomId(input.id));
      return deleted;
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: {
          id: input.id,
          ...workflowScope(ctx.auth),
        },
        data: {
          name: input.name,
        },
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      const allowedTypes = new Set<string>(Object.values(NodeType));
      const invalidTypes = [
        ...new Set(
          nodes
            .map((node) => node.type)
            .filter(
              (type): type is string => !!type && !allowedTypes.has(type),
            ),
        ),
      ];
      if (invalidTypes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown node type(s): ${invalidTypes.join(", ")}. Restart the Next.js server if you just added a node type.`,
        });
      }

      const persistableNodes = nodes.filter(
        (node): node is typeof node & { type: NodeType } =>
          !!node.type && allowedTypes.has(node.type),
      );

      await prisma.workflow.findUniqueOrThrow({
        where: { id, ...workflowScope(ctx.auth) },
      });

      return await prisma.$transaction(async (tx) => {
        // Delete existing nodes and connections
        await tx.node.deleteMany({
          where: { workflowId: id },
        });

        // Create nodes
        await tx.node.createMany({
          data: persistableNodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type,
            type: node.type,
            position: node.position,
            data: node.data || {},
          })),
        });

        // Create connections
        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        // Update workflow's UpdatedAt timestamp
        const updatedWorkflow = await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
        return updatedWorkflow;
      });
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: {
          id: input.id,
          ...workflowScope(ctx.auth),
        },
        include: {
          nodes: true,
          connections: true,
        },
      });

      // Transform the server Nodes to react-flow compatible Nodes
      // Use the helper function to safely parse position
      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: parsePosition(node.position),
        data: (node.data as Record<string, unknown>) || {},
      }));

      // Transform the server Connections to react-flow compatible Edges
      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return {
        id: workflow.id,
        name: workflow.name,
        nodes,
        edges,
      };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            ...workflowScope(ctx.auth),
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        }),
        prisma.workflow.count({
          where: {
            ...workflowScope(ctx.auth),
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),
});
