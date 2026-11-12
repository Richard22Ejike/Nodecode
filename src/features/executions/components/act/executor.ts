// src/features/executions/components/act/executor.ts
import type { NodeExecutor } from "@/features/executions/types";
import { withBrowserSession } from "@/lib/browser-session";
import { renderRequired, withResult } from "../browser/shared";

type ActData = { variableName?: string; instruction?: string };

export const actExecutor: NodeExecutor<ActData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  const instruction = renderRequired(
    data.instruction,
    context,
    "Act node: instruction",
  );

  const { result, sessionId } = await withBrowserSession(
    { context, step, stepId: `act:${nodeId}` },
    async (stagehand) => {
      const outcome = await stagehand.act(instruction);
      return {
        success: outcome.success,
        message: outcome.message,
        actionDescription: outcome.actionDescription,
        url: stagehand.context.pages()[0]?.url() ?? null,
      };
    },
  );

  return withResult(context, sessionId, data.variableName || "act", result);
};
