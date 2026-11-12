// src/features/executions/components/open-url/executor.ts
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { withBrowserSession } from "@/lib/browser-session";
import { renderRequired, withResult } from "../browser/shared";

type OpenUrlData = { variableName?: string; url?: string };

export const openUrlExecutor: NodeExecutor<OpenUrlData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  const url = renderRequired(data.url, context, "Open URL node: URL");
  try {
    new URL(url);
  } catch {
    throw new NonRetriableError(`Open URL node: "${url}" is not a valid URL`);
  }

  const { result, sessionId } = await withBrowserSession(
    { context, step, stepId: `open-url:${nodeId}` },
    async (stagehand) => {
      const page = stagehand.context.pages()[0];
      await page.goto(url, { waitUntil: "domcontentloaded", timeoutMs: 30000 });
      return { url: page.url(), title: await page.title() };
    },
  );

  return withResult(context, sessionId, data.variableName || "openUrl", result);
};
