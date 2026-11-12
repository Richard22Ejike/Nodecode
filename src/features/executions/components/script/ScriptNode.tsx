// src/features/executions/components/script/ScriptNode.tsx
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { CodeIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/BaseExecutionNode";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { SCRIPT_CHANNEL_NAME } from "@/inngest/channels/script";
import { fetchScriptRealtimeToken } from "./actions";
import { ScriptDialog, type ScriptValues } from "./Dialog";

export const ScriptNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: SCRIPT_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchScriptRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: ScriptValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }
        return node;
      }),
    );
  };

  const data = props.data as { variableName?: string; script?: string };
  const description = data?.script
    ? `Script → ${data.variableName || "scriptResult"}`
    : "Run custom JavaScript code";

  return (
    <>
      <ScriptDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={props.data as ScriptValues}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        icon={CodeIcon}
        name="Script"
        description={description}
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

ScriptNode.displayName = "ScriptNode";
