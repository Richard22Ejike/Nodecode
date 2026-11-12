import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { generateObject, type LanguageModel } from "ai";
import z from "zod";
import { CredentialType, NodeType } from "@/generated/prisma/enums";
import prisma from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { type AuthScope, workflowScope } from "@/lib/workflow-scope";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
  fetchGithubCode,
  formatFilesForPrompt,
  parseGithubUrl,
} from "./github";

// Node types the agent is allowed to place on the canvas
const AGENT_NODE_TYPES = [
  "MANUAL_TRIGGER",
  "HTTP_REQUEST",
  "GEMINI",
  "BROWSE_TRIGGER",
  "FETCH_TRIGGER",
  "SEARCH_TRIGGER",
  "SCRIPT",
  "TELEGRAM",
  "TELEGRAM_SEND",
  "WHATSAPP_TRIGGER",
  "WHATSAPP",
] as const;

type AgentNodeType = (typeof AGENT_NODE_TYPES)[number];

const workflowPlanSchema = z.object({
  nodes: z.array(
    z.object({
      key: z
        .string()
        .describe(
          "Short unique identifier for this node, e.g. 'trigger', 'fetch_page', 'summarize'. To modify an existing node, use its existing key.",
        ),
      // Kept as a plain string and normalized after generation so small
      // local models that emit e.g. "manual_trigger" don't fail validation
      type: z.string().describe(`One of: ${AGENT_NODE_TYPES.join(", ")}`),
      dataJson: z
        .string()
        .describe(
          "The node's configuration as a JSON object string. Use '{}' when the node needs no configuration.",
        ),
    }),
  ),
  edges: z.array(
    z.object({
      source: z
        .string()
        .describe("key of the source node (may be an existing node's key)"),
      target: z
        .string()
        .describe("key of the target node (may be an existing node's key)"),
    }),
  ),
});

type WorkflowPlan = z.infer<typeof workflowPlanSchema>;

const SYSTEM_PROMPT = `You are a workflow builder agent for a node-based automation platform.
You ADD nodes to an existing workflow. Existing nodes are kept automatically — do NOT re-output them.

Rules:
- Output only the NEW nodes needed for the user's request, plus the edges that connect them.
- Edges connect node "key" values. You may (and should) reference existing node keys in edges to connect new nodes to the existing workflow.
- If the canvas is empty, the first node must be a MANUAL_TRIGGER (dataJson: "{}"). If a manual trigger already exists, never add another one.
- To change the configuration of an existing node, output a node with that node's existing key and the new dataJson; it will be updated, not duplicated.
- The graph must stay acyclic. dataJson must always be a valid JSON object string.

Node types and their dataJson configuration:

1. MANUAL_TRIGGER — starts the workflow when the user clicks Execute.
   dataJson: {}

2. HTTP_REQUEST — makes an HTTP request.
   dataJson: { "variableName": string (unique identifier, e.g. "apiCall"), "endpoint": string (URL, may contain {{templates}}), "method": "GET"|"POST"|"PUT"|"PATCH"|"DELETE", "body": string (JSON string, only for POST/PUT/PATCH) }
   Result available downstream as {{variableName.httpResponse.data}}

3. GEMINI — generates text with an LLM.
   dataJson: { "variableName": string (unique), "systemPrompt": string (optional), "userPrompt": string (may contain {{templates}}) }
   Result available downstream as {{variableName.text}}

4. BROWSE_TRIGGER — browses a website with a cloud browser: navigate, click, type, extract structured data.
   dataJson: { "variableName": string (unique, e.g. "productPage"), "url": string, "instruction": string (what to extract), "actions": array of { "type": "click"|"type"|"navigate"|"scroll"|"wait", "selector"?: string, "value"?: string } (optional), "extractSchema": string (JSON string mapping field names to "string"|"number"|"boolean", optional), "selector": string (optional CSS scope), "timeoutMs": number (optional) }
   Result available downstream as {{variableName.extractedData}}

5. FETCH_TRIGGER — fetches a page's content.
   dataJson: { "variableName": string (unique, e.g. "articlePage"), "url": string (may contain {{templates}}), "selector": string (optional), "markdown": boolean, "timeoutMs": number (optional) }
   Result available downstream as {{variableName.content}} or {{variableName.markdownContent}}

6. SEARCH_TRIGGER — searches the web.
   dataJson: { "variableName": string (unique, e.g. "newsSearch"), "query": string (may contain {{templates}}), "numResults": number (optional, default 10), "searchEngine": "google"|"bing"|"duckduckgo" (optional) }
   Result available downstream as {{variableName.results}} (array of { title, url, description })

7. SCRIPT — runs custom JavaScript for transforming data, filtering, math, parsing, or calling APIs directly.
   dataJson: { "variableName": string (unique, e.g. "topUrls"), "script": string (JavaScript source; it is the body of an async function; previous node results are available on the \`context\` object, e.g. context.newsSearch.results; use \`return\` to output a JSON-serializable value; \`await\` and \`fetch\` are supported), "timeoutMs": number (optional) }
   Result available downstream as {{variableName}} (or a property like {{topUrls.count}} if the script returns an object)
   Prefer SCRIPT over templates when data needs real logic (loops, conditionals, parsing, deduplication).

8. TELEGRAM — trigger: starts the workflow when the Telegram bot receives a message.
   dataJson: {}
   Incoming message is available as {{text}}, {{chatId}}, {{telegramResult.text}}

9. TELEGRAM_SEND — sends a Telegram message (or replies to the incoming chat).
   dataJson: { "variableName": string (unique), "chatId": string (use "{{chatId}}" to reply), "content": string (may contain {{templates}}) }
   Result available downstream as {{variableName.sent}}

10. WHATSAPP_TRIGGER — trigger: starts the workflow when a WhatsApp Cloud API message is received.
    dataJson: { "verifyToken": string }
    Incoming message is available as {{text}}, {{chatId}}, {{whatsappResult.text}}

11. WHATSAPP — sends a WhatsApp Cloud API text message (or replies to the incoming sender).
    dataJson: { "variableName": string (unique), "phoneNumberId": string, "to": string (use "{{chatId}}" to reply), "content": string (may contain {{templates}}) }
    Result available downstream as {{variableName.sent}}

Passing data between nodes (IMPORTANT):
- Node inputs marked with {{templates}} support Handlebars referencing earlier results by their variableName.
- The MOST RECENT result of each kind is also always available under a default name, regardless of variableName:
  {{searchResult.results.[0].url}} = first result URL of the latest SEARCH_TRIGGER
  {{fetchResult.markdownContent}} = content of the latest FETCH_TRIGGER
  {{browseResult.extractedData}} = data of the latest BROWSE_TRIGGER
- Array items use .[index] syntax: the URL of the first search result is {{newsSearch.results.[0].url}}
- Use {{json someVariable}} to insert an object as a JSON string, e.g. {{json newsSearch.results}} in a Gemini prompt.
- With multiple nodes of the same type, give each a unique variableName and reference results by that name; the default name only points at the latest one.
- A node can only reference results of nodes that come BEFORE it in the edge chain.

Example — "search for X, fetch the top result, summarize it":
nodes: MANUAL_TRIGGER; SEARCH_TRIGGER {"variableName":"webSearch","query":"X"}; FETCH_TRIGGER {"variableName":"topResult","url":"{{webSearch.results.[0].url}}","markdown":true}; GEMINI {"variableName":"summary","userPrompt":"Summarize this article:\\n{{topResult.markdownContent}}"}
edges: trigger→search→fetch→gemini`;

const IMPORT_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

IMPORT MODE — you are given source code from a GitHub repository. Convert it into a workflow that reproduces the code's core behavior:
- Break the code into logical stages (input/fetch, parse, transform, aggregate, output) and create one SCRIPT node per stage. Keep each script small and focused on one job.
- Scripts must be self-contained plain JavaScript: no import/require, no npm packages, no filesystem access. Re-implement the essential logic inline. Use \`fetch\` for network calls.
- The relations between scripts ARE the edges: wire the nodes in execution order so each stage's output flows to the next. A later script reads an earlier script's result from \`context.<variableName>\`.
- Give every node a descriptive camelCase variableName that reflects its stage, e.g. "rawData", "parsedItems", "rankedResults".
- Where a stage maps naturally onto a specialized node, prefer it over a script: HTTP_REQUEST for a plain API call, FETCH_TRIGGER for reading a web page, SEARCH_TRIGGER for a web search, GEMINI for text generation/summarization.
- Skip boilerplate that has no meaning in a workflow (CLI argument parsing, logging setup, exports, tests, type definitions).`;

type PlannedNode = {
  key: string;
  type: AgentNodeType;
  dataJson: string;
};

// Local testing via LM Studio's OpenAI-compatible server.
// Set AGENT_LLM_PROVIDER=lmstudio in .env to enable; falls back to the
// user's Gemini credential otherwise.
const useLmStudio = () => process.env.AGENT_LLM_PROVIDER === "lmstudio";

const getLmStudioModel = (): LanguageModel => {
  const lmstudio = createOpenAI({
    baseURL: process.env.LM_STUDIO_BASE_URL ?? "http://127.0.0.1:1234/v1",
    // LM Studio ignores the API key but the client requires one
    apiKey: process.env.LM_STUDIO_API_KEY ?? "lm-studio",
  });
  // .chat() targets /v1/chat/completions (LM Studio has no Responses API)
  return lmstudio.chat(process.env.LM_STUDIO_MODEL ?? "google/gemma-3n-e4b");
};

const parseNodeData = (dataJson: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(dataJson);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
};

const parsePosition = (position: unknown): { x: number; y: number } => {
  if (typeof position === "object" && position !== null) {
    const pos = position as Record<string, unknown>;
    if (typeof pos.x === "number" && typeof pos.y === "number") {
      return { x: pos.x, y: pos.y };
    }
  }
  return { x: 0, y: 0 };
};

const loadWorkflow = (workflowId: string, scope: AuthScope) =>
  prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId, ...workflowScope(scope) },
    include: { nodes: true, connections: true },
  });

type WorkflowWithGraph = Awaited<ReturnType<typeof loadWorkflow>>;
type GeminiCredential = { id: string; value: string } | null;

const resolvePlannerModel = async (
  userId: string,
): Promise<{ model: LanguageModel; geminiCredential: GeminiCredential }> => {
  const geminiCredential = await prisma.credential.findFirst({
    where: { userId, type: CredentialType.GEMINI },
    orderBy: { updatedAt: "desc" },
  });

  if (useLmStudio()) {
    return { model: getLmStudioModel(), geminiCredential };
  }

  if (!geminiCredential) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Add a Gemini credential first — the agent uses it to plan the workflow.",
    });
  }
  const google = createGoogleGenerativeAI({
    apiKey: decrypt(geminiCredential.value),
  });
  return { model: google("gemini-2.5-flash"), geminiCredential };
};

const buildExistingWorkflowContext = (workflow: WorkflowWithGraph): string => {
  const existingNodes = workflow.nodes.filter(
    (node) => node.type !== NodeType.INITIAL,
  );
  if (!existingNodes.length) {
    return "The canvas is currently empty.";
  }
  return `Existing workflow (these nodes already exist — reference their keys in edges, do not re-output them):\nNodes:\n${JSON.stringify(
    existingNodes.map((node) => ({
      key: node.id,
      type: node.type,
      data: node.data,
    })),
    null,
    2,
  )}\nEdges:\n${JSON.stringify(
    workflow.connections.map((connection) => ({
      source: connection.fromNodeId,
      target: connection.toNodeId,
    })),
    null,
    2,
  )}`;
};

const normalizePlannedNodes = (plan: WorkflowPlan): PlannedNode[] =>
  plan.nodes.flatMap((node) => {
    const type = node.type.trim().toUpperCase();
    if (!(AGENT_NODE_TYPES as readonly string[]).includes(type)) {
      return [];
    }
    return [{ ...node, type: type as AgentNodeType }];
  });

// Merges a generated plan into the existing workflow: keeps existing nodes,
// enforces a single manual trigger, lays out new nodes, and connects orphans.
const mergePlanIntoWorkflow = (
  workflow: WorkflowWithGraph,
  plannedNodes: PlannedNode[],
  planEdges: WorkflowPlan["edges"],
  geminiCredential: GeminiCredential,
) => {
  const existingNodes = workflow.nodes.filter(
    (node) => node.type !== NodeType.INITIAL,
  );
  const existingIds = new Set(existingNodes.map((node) => node.id));
  const existingTrigger = existingNodes.find(
    (node) => node.type === NodeType.MANUAL_TRIGGER,
  );

  // Plan keys resolve to real node ids. Existing ids map to themselves
  // so edges can reference existing nodes directly.
  const keyToId = new Map<string, string>();
  for (const id of existingIds) {
    keyToId.set(id, id);
  }

  // Data updates for existing nodes the model chose to reconfigure
  const dataUpdates = new Map<string, Record<string, unknown>>();

  let triggerId = existingTrigger?.id ?? null;
  const newNodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }> = [];

  for (const node of plannedNodes) {
    // Modification of an existing node
    if (existingIds.has(node.key)) {
      const data = parseNodeData(node.dataJson);
      if (Object.keys(data).length) {
        dataUpdates.set(node.key, data);
      }
      continue;
    }

    // Enforce a single manual trigger: remap duplicates onto the real one
    if (node.type === "MANUAL_TRIGGER") {
      if (triggerId) {
        keyToId.set(node.key, triggerId);
        continue;
      }
      triggerId = createId();
      keyToId.set(node.key, triggerId);
      newNodes.push({
        id: triggerId,
        type: "MANUAL_TRIGGER",
        position: { x: 0, y: 0 },
        data: {},
      });
      continue;
    }

    const id = createId();
    keyToId.set(node.key, id);
    const data = parseNodeData(node.dataJson);
    if (node.type === "GEMINI" && geminiCredential) {
      data.credentialId = geminiCredential.id;
    }
    newNodes.push({
      id,
      type: node.type,
      position: { x: 0, y: 0 },
      data,
    });
  }

  // The model may forget the trigger entirely on an empty canvas
  if (!triggerId) {
    triggerId = createId();
    newNodes.unshift({
      id: triggerId,
      type: "MANUAL_TRIGGER",
      position: { x: 0, y: 0 },
      data: {},
    });
  }

  // Lay out new nodes to the right of the existing graph
  const baseX = existingNodes.length
    ? Math.max(...existingNodes.map((node) => parsePosition(node.position).x)) +
      300
    : 120;
  newNodes.forEach((node, index) => {
    node.position = { x: baseX + index * 300, y: 240 };
  });

  const mergedNodes = [
    ...existingNodes.map((node) => ({
      id: node.id,
      type: node.type as string,
      position: parsePosition(node.position),
      data: {
        ...(node.data as Record<string, unknown>),
        ...(dataUpdates.get(node.id) ?? {}),
      },
    })),
    ...newNodes,
  ];

  // Existing edges are preserved; planned edges are added on top
  const mergedEdges = workflow.connections.map((connection) => ({
    id: connection.id,
    source: connection.fromNodeId,
    target: connection.toNodeId,
    sourceHandle: connection.fromOutput,
    targetHandle: connection.toInput,
  }));
  const edgePairs = new Set(
    mergedEdges.map((edge) => `${edge.source}->${edge.target}`),
  );

  for (const edge of planEdges) {
    const source = keyToId.get(edge.source);
    const target = keyToId.get(edge.target);
    if (!source || !target || source === target) continue;
    const pair = `${source}->${target}`;
    if (edgePairs.has(pair)) continue;
    edgePairs.add(pair);
    mergedEdges.push({
      id: createId(),
      source,
      target,
      sourceHandle: "source-1",
      targetHandle: "target-1",
    });
  }

  // Connect orphaned new nodes so everything is reachable from the
  // trigger: attach them to the previous end of the workflow.
  const previousOutgoing = new Set(
    workflow.connections.map((connection) => connection.fromNodeId),
  );
  const attachPoint =
    existingNodes.find(
      (node) => !previousOutgoing.has(node.id) && node.id !== triggerId,
    )?.id ?? triggerId;

  const hasIncoming = new Set(mergedEdges.map((edge) => edge.target));
  for (const node of newNodes) {
    if (node.id === triggerId) continue;
    if (hasIncoming.has(node.id)) continue;
    if (attachPoint === node.id) continue;
    mergedEdges.push({
      id: createId(),
      source: attachPoint,
      target: node.id,
      sourceHandle: "source-1",
      targetHandle: "target-1",
    });
    hasIncoming.add(node.id);
  }

  return { nodes: mergedNodes, edges: mergedEdges };
};

export const agentRouter = createTRPCRouter({
  generateWorkflow: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        prompt: z.string().min(1, "Prompt is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await loadWorkflow(input.workflowId, ctx.auth);
      const { model, geminiCredential } = await resolvePlannerModel(
        ctx.auth.user.id,
      );

      const { object: plan } = await generateObject({
        model,
        system: SYSTEM_PROMPT,
        prompt: `${buildExistingWorkflowContext(workflow)}\n\nUser request: ${input.prompt}`,
        schema: workflowPlanSchema,
      });

      const plannedNodes = normalizePlannedNodes(plan);
      if (!plannedNodes.length) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message:
            "The agent could not produce a workflow for that prompt. Try rephrasing it.",
        });
      }

      return mergePlanIntoWorkflow(
        workflow,
        plannedNodes,
        plan.edges,
        geminiCredential,
      );
    }),

  importFromGithub: protectedProcedure
    .input(
      z.object({
        workflowId: z.string(),
        url: z.string().min(1, "GitHub URL is required"),
        instructions: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workflow = await loadWorkflow(input.workflowId, ctx.auth);
      const { model, geminiCredential } = await resolvePlannerModel(
        ctx.auth.user.id,
      );

      let parsedUrl: ReturnType<typeof parseGithubUrl>;
      try {
        parsedUrl = parseGithubUrl(input.url);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Invalid GitHub URL",
        });
      }

      let files: Awaited<ReturnType<typeof fetchGithubCode>>;
      try {
        files = await fetchGithubCode(parsedUrl);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Failed to fetch code from GitHub",
        });
      }

      if (!files.length) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message:
            "No code files found at that GitHub URL. Point it at a repo, folder, or file containing source code.",
        });
      }

      const instructions = input.instructions?.trim()
        ? `\n\nAdditional instructions from the user: ${input.instructions.trim()}`
        : "";

      const { object: plan } = await generateObject({
        model,
        system: IMPORT_SYSTEM_PROMPT,
        prompt: `${buildExistingWorkflowContext(workflow)}\n\nSource code imported from ${input.url}:\n${formatFilesForPrompt(files)}${instructions}\n\nConvert this code into workflow nodes with edges describing how data flows between them.`,
        schema: workflowPlanSchema,
      });

      const plannedNodes = normalizePlannedNodes(plan);
      if (!plannedNodes.length) {
        throw new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
          message:
            "The agent could not convert that code into workflow nodes. Try pointing at a specific file or adding instructions.",
        });
      }

      const result = mergePlanIntoWorkflow(
        workflow,
        plannedNodes,
        plan.edges,
        geminiCredential,
      );
      return { ...result, filesImported: files.map((file) => file.path) };
    }),
});
