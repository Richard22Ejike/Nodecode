// src/features/triggers/components/search-trigger/executor.ts

import { z } from "zod";
import type { NodeExecutor } from "@/features/executions/types";
import { searchTriggerChannel } from "@/inngest/channels/search-trigger";
import { getStagehand } from "@/lib/browserbase";
import { compileTemplate } from "@/lib/handlebars-template";

type SearchTriggerData = {
  variableName?: string;
  query: string;
  numResults?: number;
  searchEngine?: "google" | "bing" | "duckduckgo";
  timeoutMs?: number;
};

export const searchTriggerExecutor: NodeExecutor = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  const searchData = data as SearchTriggerData;

  // Validate required fields
  if (!searchData.query) {
    const error = new Error(
      "Search trigger requires a query. Please configure the node with a search query.",
    );
    console.error("❌ [Search Executor] Query is missing");
    await publish(searchTriggerChannel().status({ nodeId, status: "error" }));
    throw error;
  }

  // Resolve {{templates}} against results of previous nodes
  const resolvedQuery = searchData.query.includes("{{")
    ? compileTemplate(
        searchData.query,
        context,
        "Search node: failed to resolve query template",
      )
    : searchData.query;

  console.log(`🔍 [Search Executor] Query: "${resolvedQuery}"`);
  console.log(
    `🔍 [Search Executor] Search Engine: ${searchData.searchEngine || "google"}`,
  );
  console.log(
    `🔍 [Search Executor] Num Results: ${searchData.numResults || 10}`,
  );

  await publish(searchTriggerChannel().status({ nodeId, status: "loading" }));

  try {
    const result = await step.run(`search-trigger:${nodeId}`, async () => {
      console.log(`🔧 [Search Executor] Initializing Stagehand...`);

      let stagehand: ReturnType<typeof getStagehand>;
      try {
        stagehand = getStagehand();
        await stagehand.init();
      } catch (initError) {
        console.error(
          "❌ [Search Executor] Stagehand initialization failed:",
          initError,
        );
        throw new Error(
          `Stagehand initialization failed: ${initError instanceof Error ? initError.message : String(initError)}`,
        );
      }

      try {
        const page = stagehand.context.pages()[0];

        const searchUrls = {
          google: "https://www.google.com/search?q=",
          bing: "https://www.bing.com/search?q=",
          duckduckgo: "https://duckduckgo.com/?q=",
        };

        const baseUrl = searchUrls[searchData.searchEngine || "google"];
        const query = encodeURIComponent(resolvedQuery);
        const url = `${baseUrl}${query}`;

        console.log(`🌐 [Search Executor] Navigating to: ${url}`);

        // Navigate to the search URL
        await page.goto(url, {
          waitUntil: "networkidle",
          timeoutMs: searchData.timeoutMs || 30000,
        });

        console.log(`✅ [Search Executor] Page loaded`);

        const numResults = searchData.numResults || 10;

        console.log(`📊 [Search Executor] Extracting ${numResults} results...`);

        // Use the correct Stagehand extract API with instruction as first argument
        const searchResults = await stagehand.extract(
          `Extract the top ${numResults} search results with titles, URLs, and descriptions`,
          z.object({
            results: z.array(
              z.object({
                title: z.string(),
                url: z.string().url(),
                description: z.string(),
              }),
            ),
          }),
        );

        console.log(`✅ [Search Executor] Extraction complete`);

        await stagehand.close();

        return {
          query: resolvedQuery,
          searchEngine: searchData.searchEngine || "google",
          results: searchResults.results || [],
          totalResults: (searchResults.results || []).length,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        await stagehand.close();
        throw error;
      }
    });

    await publish(searchTriggerChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      // Default alias always points at the most recent search node
      searchResult: result,
      [searchData.variableName || "searchResult"]: result,
    };
  } catch (error) {
    console.error(`❌ [Search Executor] Node ${nodeId} failed:`, error);
    await publish(searchTriggerChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
