// src/features/executions/components/browser/createConfigNode.tsx
"use client";

import { type NodeProps, useReactFlow } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/BaseExecutionNode";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import {
  ConfigDialog,
  type ConfigValues,
  type FieldConfig,
} from "./ConfigDialog";
import { getUpstreamChips, type UpstreamChip } from "./upstream-chips";

export type ConfigNodeSpec = {
  /** Display name on the canvas, e.g. "Act". */
  name: string;
  icon: LucideIcon;
  /** Variable the node writes to when the user does not name one. */
  defaultVariable: string;
  dialogTitle: string;
  dialogDescription: string;
  fields: FieldConfig[];
  /** Shown on the node before it has been configured. */
  emptyDescription: string;
  /** Short summary shown on the node once configured. */
  describe: (data: ConfigValues) => string | undefined;
};

/**
 * Builds a canvas node + settings dialog from a field list, so nodes that are
 * just "a few labelled inputs and a result variable" need no bespoke UI.
 */
export function createConfigNode(spec: ConfigNodeSpec) {
  const ConfigNode = memo((props: NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes, getNodes, getEdges } = useReactFlow();
    const [chips, setChips] = useState<UpstreamChip[]>([]);
    const nodeStatus = useNodeStatus({ nodeId: props.id });

    const handleSubmit = (values: ConfigValues) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === props.id
            ? { ...node, data: { ...node.data, ...values } }
            : node,
        ),
      );
    };

    // Recomputed each time the dialog opens so it reflects current connections
    const openSettings = () => {
      setChips(getUpstreamChips(getNodes(), getEdges(), props.id));
      setDialogOpen(true);
    };

    const data = (props.data ?? {}) as ConfigValues;
    const description = spec.describe(data) ?? spec.emptyDescription;

    return (
      <>
        <ConfigDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title={spec.dialogTitle}
          description={spec.dialogDescription}
          defaultVariable={spec.defaultVariable}
          fields={spec.fields}
          defaultValues={data}
          chips={chips}
          onSubmit={handleSubmit}
        />
        <BaseExecutionNode
          {...props}
          icon={spec.icon}
          name={spec.name}
          description={description}
          status={nodeStatus}
          onSettings={openSettings}
          onDoubleClick={openSettings}
        />
      </>
    );
  });

  ConfigNode.displayName = `${spec.name}Node`;
  return ConfigNode;
}
