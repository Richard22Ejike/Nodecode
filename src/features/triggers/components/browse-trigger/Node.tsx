// src/features/triggers/components/browse-trigger/Node.tsx
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/BaseExecutionNode";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { BROWSE_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/browse-trigger";
import { fetchBrowseTriggerRealtimeToken } from "./actions";
import { BrowseTriggerDialog } from "./Dialog";

export const BrowseTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { updateNodeData } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: BROWSE_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchBrowseTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: Record<string, unknown>) => {
    updateNodeData(props.id, values);
  };

  return (
    <>
      <BrowseTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={props.data}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        icon="/logos/browse.svg"
        name="Browse"
        description={
          props.data?.url
            ? `Browse: ${props.data.url}`
            : "Navigate, click, type, and extract data from websites"
        }
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

BrowseTriggerNode.displayName = "BrowseTriggerNode";
