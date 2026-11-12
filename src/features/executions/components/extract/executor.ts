// src/features/executions/components/extract/executor.ts
import type { NodeExecutor } from "@/features/executions/types";
import { withBrowserSession } from "@/lib/browser-session";
import { renderRequired, withResult } from "../browser/shared";

type ExtractData = { variableName?: string; instruction?: string };

export const extractExecutor: NodeExecutor<ExtractData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  const instruction = renderRequired(
    data.instruction,
    context,
    "Extract node: instruction",
  );

  const { result, sessionId } = await withBrowserSession(
    { context, step, stepId: `extract:${nodeId}` },
    async (stagehand) => stagehand.extract(instruction),
  );

  return withResult(context, sessionId, data.variableName || "extract", result);
};
