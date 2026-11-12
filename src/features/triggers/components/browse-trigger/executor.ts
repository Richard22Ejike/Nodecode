// src/features/triggers/components/browse-trigger/executor.ts

import { z } from "zod";
import type { NodeExecutor } from "@/features/executions/types";
import { browseTriggerChannel } from "@/inngest/channels/browse-trigger";
import { getStagehand } from "@/lib/browserbase";
import { compileTemplate } from "@/lib/handlebars-template";

type BrowseTriggerData = {
  variableName?: string;
  instruction?: string;
  url?: string;
  actions?: Array<{
    type: "click" | "type" | "navigate" | "scroll" | "wait";
    selector?: string;
    value?: string;
  }>;
  waitForSelector?: string;
  extractSchema?: string;
  timeoutMs?: number;
  selector?: string;
};

export const browseTriggerExecutor: NodeExecutor = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  // LOG: Print the raw data received
  console.log(
    "🔍 [Browse Executor] Raw data received:",
    JSON.stringify(data, null, 2),
  );
  console.log("🔍 [Browse Executor] Data keys:", Object.keys(data || {}));
  console.log("🔍 [Browse Executor] Node ID:", nodeId);

  const browseData = data as BrowseTriggerData;

  // LOG: Print the parsed browseData
  console.log("🔍 [Browse Executor] Parsed browseData:", {
    url: browseData.url,
    instruction: browseData.instruction,
    actions: browseData.actions,
    waitForSelector: browseData.waitForSelector,
    extractSchema: browseData.extractSchema,
    timeoutMs: browseData.timeoutMs,
    selector: browseData.selector,
  });

  // Validate required fields
  if (!browseData.url) {
    console.error("❌ [Browse Executor] URL is missing or empty!");
    console.error(
      "❌ [Browse Executor] Full browseData:",
      JSON.stringify(browseData, null, 2),
    );

    const error = new Error(
      "Browse trigger requires a URL. Please configure the node with a target URL.",
    );

    await publish(
      browseTriggerChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }

  // Resolve {{templates}} against results of previous nodes
  const resolve = (value: string | undefined, label: string) =>
    value?.includes("{{")
      ? compileTemplate(
          value,
          context,
          `Browse node: failed to resolve ${label} template`,
        )
      : value;

  const resolvedUrl = resolve(browseData.url, "URL") ?? browseData.url;
  const resolvedInstruction = resolve(browseData.instruction, "instruction");
  const resolvedSelector = resolve(browseData.selector, "selector");
  const resolvedActions = browseData.actions?.map((action) => ({
    ...action,
    selector: resolve(action.selector, "action selector"),
    value: resolve(action.value, "action value"),
  }));

  console.log("✅ [Browse Executor] URL validated:", resolvedUrl);

  await publish(
    browseTriggerChannel().status({
      nodeId,
      status: "loading",
    }),
  );

  try {
    const result = await step.run(`browse-trigger:${nodeId}`, async () => {
      console.log("🚀 [Browse Executor] Starting Stagehand...");
      const stagehand = getStagehand();

      try {
        await stagehand.init();
        console.log("✅ [Browse Executor] Stagehand initialized");
        const page = stagehand.context.pages()[0];

        console.log(`🌐 [Browse Executor] Navigating to: ${resolvedUrl}`);
        console.log(
          `⏱️ [Browse Executor] Timeout: ${browseData.timeoutMs || 30000}ms`,
        );

        // Navigate to URL with error handling
        await page.goto(resolvedUrl, {
          waitUntil: "networkidle",
          timeoutMs: browseData.timeoutMs || 30000,
        });

        console.log(`✅ [Browse Executor] Page loaded: ${resolvedUrl}`);

        // Execute actions if provided
        if (resolvedActions && resolvedActions.length > 0) {
          console.log(
            `🔄 [Browse Executor] Executing ${resolvedActions.length} actions...`,
          );
          for (let i = 0; i < resolvedActions.length; i++) {
            const action = resolvedActions[i];
            console.log(`  📌 [Browse Executor] Action ${i + 1}:`, action);

            switch (action.type) {
              case "click":
                if (action.selector) {
                  console.log(
                    `🖱️ [Browse Executor] Clicking: ${action.selector}`,
                  );
                  await stagehand.act(`Click on ${action.selector}`);
                }
                break;
              case "type":
                if (action.selector && action.value) {
                  console.log(
                    `⌨️ [Browse Executor] Typing "${action.value}" into ${action.selector}`,
                  );
                  await stagehand.act(
                    `Type "${action.value}" into ${action.selector}`,
                  );
                }
                break;
              case "navigate":
                if (action.value) {
                  console.log(
                    `🌐 [Browse Executor] Navigating to: ${action.value}`,
                  );
                  await page.goto(action.value, { waitUntil: "networkidle" });
                }
                break;
              case "scroll":
                console.log(`📜 [Browse Executor] Scrolling down`);
                await stagehand.act("Scroll down the page");
                break;
              case "wait": {
                const waitMs = action.value ? parseInt(action.value, 10) : 1000;
                console.log(`⏳ [Browse Executor] Waiting ${waitMs}ms`);
                await page.waitForTimeout(waitMs);
                break;
              }
            }
          }
        } else {
          console.log(`ℹ️ [Browse Executor] No actions to execute`);
        }

        // Wait for selector if provided
        if (browseData.waitForSelector) {
          console.log(
            `⏳ [Browse Executor] Waiting for selector: ${browseData.waitForSelector}`,
          );
          await page.waitForSelector(browseData.waitForSelector, {
            timeout: 10000,
          });
        }

        // Extract data if schema is provided
        let extractedData = null;
        if (browseData.extractSchema) {
          console.log(
            `📊 [Browse Executor] Extract schema provided: ${browseData.extractSchema}`,
          );
          try {
            const schema = JSON.parse(browseData.extractSchema);
            const extractSchema = z.object(schema);

            const instruction =
              resolvedInstruction || "Extract the requested data from the page";
            console.log(
              `📊 [Browse Executor] Extraction instruction: ${instruction}`,
            );

            if (resolvedSelector) {
              console.log(
                `📍 [Browse Executor] Using selector: ${resolvedSelector}`,
              );
              const result = await stagehand.extract(
                instruction,
                extractSchema,
                {
                  selector: resolvedSelector,
                  timeout: browseData.timeoutMs || 30000,
                },
              );
              extractedData = result;
              console.log(
                `✅ [Browse Executor] Extraction complete with selector`,
              );
            } else {
              console.log(
                `📍 [Browse Executor] No selector, extracting from entire page`,
              );
              const result = await stagehand.extract(
                instruction,
                extractSchema,
              );
              extractedData = result;
              console.log(
                `✅ [Browse Executor] Extraction complete without selector`,
              );
            }
            console.log(
              `📊 [Browse Executor] Extracted data:`,
              JSON.stringify(extractedData, null, 2),
            );
          } catch (error) {
            console.error("❌ [Browse Executor] Extraction failed:", error);
          }
        } else {
          console.log(
            `ℹ️ [Browse Executor] No extract schema provided, skipping extraction`,
          );
        }

        await stagehand.close();
        console.log(`🔒 [Browse Executor] Stagehand closed`);

        return {
          url: resolvedUrl,
          actions: resolvedActions,
          extractedData,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error(`❌ [Browse Executor] Stagehand error:`, error);
        await stagehand.close();
        throw error;
      }
    });

    console.log(`✅ [Browse Executor] Node ${nodeId} executed successfully`);
    console.log(
      `📊 [Browse Executor] Result:`,
      JSON.stringify(result, null, 2),
    );

    await publish(
      browseTriggerChannel().status({
        nodeId,
        status: "success",
      }),
    );

    return {
      ...context,
      // Default alias always points at the most recent browse node
      browseResult: result,
      [browseData.variableName || "browseResult"]: result,
    };
  } catch (error) {
    console.error(`❌ [Browse Executor] Node ${nodeId} failed:`, error);
    await publish(
      browseTriggerChannel().status({
        nodeId,
        status: "error",
      }),
    );
    throw error;
  }
};
