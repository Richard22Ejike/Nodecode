// src/lib/browserbase.ts
import { Stagehand } from "@browserbasehq/stagehand";
import type { z } from "zod";

// Browserbase configuration
export const getStagehand = () => {
  if (!process.env.BROWSERBASE_API_KEY) {
    console.error("❌ BROWSERBASE_API_KEY is not set in environment variables");
  }
  if (!process.env.BROWSERBASE_PROJECT_ID) {
    console.error(
      "❌ BROWSERBASE_PROJECT_ID is not set in environment variables",
    );
  }
  return new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    verbose: process.env.NODE_ENV === "development" ? 1 : 0,
  });
};

// Types for different operations
export interface BrowseOptions {
  url: string;
  actions?: Array<{
    type: "click" | "type" | "navigate" | "scroll" | "wait";
    selector?: string;
    value?: string;
    timeout?: number;
  }>;
  waitForSelector?: string;
  timeout?: number;
}

export interface FetchOptions {
  url: string;
  selector?: string;
  markdown?: boolean;
  includeImages?: boolean;
}

export interface SearchOptions {
  query: string;
  numResults?: number;
  searchEngine?: "google" | "bing" | "duckduckgo";
}

export interface ExtractOptions {
  instruction: string;
  schema: z.ZodSchema;
  url?: string;
}
