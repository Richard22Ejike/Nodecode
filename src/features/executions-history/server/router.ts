import z from "zod";
import { PAGINATION } from "@/config/constants";
import prisma from "@/lib/db";
import { workflowScope } from "@/lib/workflow-scope";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const executionsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return prisma.execution.findFirstOrThrow({
        where: {
          id: input.id,
          workflow: workflowScope(ctx.auth),
        },
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }),
  /** Recent runs of one workflow, newest first, for the editor's console panel. */
  latestForWorkflow: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        limit: z.number().min(1).max(20).default(5),
      }),
    )
    .query(({ ctx, input }) => {
      return prisma.execution.findMany({
        where: {
          workflowId: input.workflowId,
          workflow: workflowScope(ctx.auth),
        },
        orderBy: { startedAt: "desc" },
        take: input.limit,
        select: {
          id: true,
          status: true,
          startedAt: true,
          completedAt: true,
          error: true,
          output: true,
        },
      });
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;

      const [items, totalCount] = await Promise.all([
        prisma.execution.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            workflow: workflowScope(ctx.auth),
          },
          orderBy: {
            startedAt: "desc",
          },
          include: {
            workflow: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.execution.count({
          where: {
            workflow: workflowScope(ctx.auth),
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
