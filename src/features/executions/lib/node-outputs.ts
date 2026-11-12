// src/features/executions/lib/node-outputs.ts
//
// What each node type writes into the run context, so the editor can offer
// "insert this value" chips. Types not listed fall back to the bare variable.

import { NodeType } from "@/generated/prisma/enums";

export type OutputField = {
  name: string;
  /** Render with the `json` helper (objects and arrays print as JSON). */
  json?: boolean;
};

export type NodeOutputs = {
  /** Variable the node writes to when the user hasn't named one. */
  defaultVariable?: string;
  fields: OutputField[];
};

export const NODE_OUTPUTS: Partial<Record<NodeType, NodeOutputs>> = {
  [NodeType.OPEN_URL]: {
    defaultVariable: "openUrl",
    fields: [{ name: "url" }, { name: "title" }],
  },
  [NodeType.ACT]: {
    defaultVariable: "act",
    fields: [
      { name: "success" },
      { name: "message" },
      { name: "actionDescription" },
      { name: "url" },
    ],
  },
  [NodeType.OBSERVE]: {
    defaultVariable: "observe",
    fields: [{ name: "matches", json: true }],
  },
  [NodeType.EXTRACT]: {
    defaultVariable: "extract",
    fields: [{ name: "extraction" }],
  },
  [NodeType.AGENT]: {
    defaultVariable: "agent",
    fields: [{ name: "success" }, { name: "completed" }, { name: "message" }],
  },
  [NodeType.SEND_EMAIL]: {
    defaultVariable: "email",
    fields: [{ name: "id" }],
  },
  [NodeType.GEMINI]: { fields: [{ name: "text" }] },
  [NodeType.OPENAI]: { fields: [{ name: "text" }] },
  [NodeType.SCRIPT]: { defaultVariable: "scriptResult", fields: [] },
};
