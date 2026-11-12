// src/features/executions/components/browser/upstream-chips.ts
import type { Edge, Node } from "@xyflow/react";
import { findNodeOption } from "@/components/node-selector";
import { NODE_OUTPUTS } from "@/features/executions/lib/node-outputs";
import type { NodeType } from "@/generated/prisma/enums";

export type UpstreamChip = {
  /** Text inserted into the field, e.g. {{extract.extraction}}. */
  token: string;
  /** Label shown on the chip, e.g. "extract.extraction". */
  label: string;
  /** Which node it comes from, for the tooltip. */
  nodeName: string;
};

/** Every node that feeds into `nodeId`, directly or through other nodes. */
function upstreamNodeIds(edges: Edge[], nodeId: string): string[] {
  const seen = new Set<string>();
  const queue = [nodeId];
  while (queue.length) {
    const current = queue.shift() as string;
    for (const edge of edges) {
      if (edge.target === current && !seen.has(edge.source)) {
        seen.add(edge.source);
        queue.push(edge.source);
      }
    }
  }
  return [...seen];
}

export function getUpstreamChips(
  nodes: Node[],
  edges: Edge[],
  nodeId: string,
): UpstreamChip[] {
  const chips: UpstreamChip[] = [];

  for (const id of upstreamNodeIds(edges, nodeId)) {
    const node = nodes.find((candidate) => candidate.id === id);
    if (!node?.type) continue;

    const meta = NODE_OUTPUTS[node.type as NodeType];
    const configured = (node.data as { variableName?: string }).variableName;
    const variable = configured?.trim() || meta?.defaultVariable;
    if (!variable) continue;

    const nodeName = findNodeOption(node.type)?.label ?? node.type;

    if (!meta || meta.fields.length === 0) {
      chips.push({ token: `{{${variable}}}`, label: variable, nodeName });
      continue;
    }

    for (const field of meta.fields) {
      const path = `${variable}.${field.name}`;
      chips.push({
        token: field.json ? `{{json ${path}}}` : `{{${path}}}`,
        label: path,
        nodeName,
      });
    }
  }

  return chips;
}
