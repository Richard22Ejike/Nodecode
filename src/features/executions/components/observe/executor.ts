// src/features/executions/components/observe/executor.ts
import type { NodeExecutor } from "@/features/executions/types";
import { withBrowserSession } from "@/lib/browser-session";
import { renderRequired, withResult } from "../browser/shared";

type ObserveData = { variableName?: string; instruction?: string };

export const observeExecutor: NodeExecutor<ObserveData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  const instruction = renderRequired(
    data.instruction,
    context,
    "Observe node: instruction",
  );

  const { result, sessionId } = await withBrowserSession(
    { context, step, stepId: `observe:${nodeId}` },
    async (stagehand) => ({ matches: await stagehand.observe(instruction) }),
  );

  return withResult(context, sessionId, data.variableName || "observe", result);
};
