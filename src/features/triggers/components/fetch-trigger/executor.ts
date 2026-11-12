// src/features/triggers/components/fetch-trigger/executor.ts

import { z } from "zod";
import type { NodeExecutor } from "@/features/executions/types";
import { fetchTriggerChannel } from "@/inngest/channels/fetch-trigger";
import { getStagehand } from "@/lib/browserbase";
import { compileTemplate } from "@/lib/handlebars-template";

type FetchTriggerData = {
  variableName?: string;
  url?: string;
  selector?: string;
  markdown?: boolean;
  includeImages?: boolean;
  timeoutMs?: number;
};

export const fetchTriggerExecutor: NodeExecutor = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const fetchData = data as FetchTriggerData;

  // Validate URL
  if (!fetchData.url) {
    const error = new Error(
      "Fetch trigger requires a URL. Please configure the node with a target URL.",
    );
    console.error("❌ [Fetch Executor] URL is missing");
    await publish(fetchTriggerChannel().status({ nodeId, status: "error" }));
    throw error;
  }

  // Resolve {{templates}} against results of previous nodes
  const resolvedUrl = fetchData.url.includes("{{")
    ? compileTemplate(
        fetchData.url,
        context,
        "Fetch node: failed to resolve URL template",
      )
    : fetchData.url;
  const resolvedSelector = fetchData.selector?.includes("{{")
    ? compileTemplate(
        fetchData.selector,
        context,
        "Fetch node: failed to resolve selector template",
      )
    : fetchData.selector;

  // Clean URL
  let cleanUrl = resolvedUrl.trim();
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = `https://${cleanUrl}`;
  }

  console.log(`🌐 [Fetch Executor] Fetching: ${cleanUrl}`);
  console.log(
    `📝 [Fetch Executor] Markdown: ${fetchData.markdown ? "Yes" : "No"}`,
  );
  console.log(
    `📝 [Fetch Executor] Selector: ${resolvedSelector || "Full page"}`,
  );

  await publish(fetchTriggerChannel().status({ nodeId, status: "loading" }));

  try {
    const result = await step.run(`fetch-trigger:${nodeId}`, async () => {
      const stagehand = getStagehand();

      try {
        await stagehand.init();
        const page = stagehand.context.pages()[0];

        await page.goto(cleanUrl, {
          waitUntil: "networkidle",
          timeoutMs: fetchData.timeoutMs || 30000,
        });

        let content = "";
        let markdownContent = "";

        if (fetchData.markdown) {
          const result = await stagehand.extract(
            "Extract the main content of this page as clean markdown",
            z.object({
              content: z.string(),
            }),
          );
          markdownContent = result.content || "";
        }

        if (resolvedSelector) {
          try {
            const result = await stagehand.extract(
              `Extract the content from the selector: ${resolvedSelector}`,
              z.object({
                content: z.string(),
              }),
              {
                selector: resolvedSelector,
              },
            );
            content = result.content || "";
          } catch {
            console.warn(
              `⚠️ [Fetch Executor] Failed to extract from selector: ${resolvedSelector}`,
            );
            content = "";
          }
        } else {
          try {
            const result = await stagehand.extract(
              "Extract the complete page content",
              z.object({
                content: z.string(),
              }),
            );
            content = result.content || "";
          } catch {
            console.warn("⚠️ [Fetch Executor] Failed to extract page content");
            content = "";
          }
        }

        await stagehand.close();

        return {
          url: cleanUrl,
          content,
          markdownContent,
          contentLength: content.length,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        await stagehand.close();
        throw error;
      }
    });

    await publish(fetchTriggerChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      // Default alias always points at the most recent fetch node
      fetchResult: result,
      [fetchData.variableName || "fetchResult"]: result,
    };
  } catch (error) {
    console.error(`❌ [Fetch Executor] Node ${nodeId} failed:`, error);
    await publish(fetchTriggerChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
