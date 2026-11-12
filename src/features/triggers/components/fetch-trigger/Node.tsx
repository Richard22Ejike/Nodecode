// src/features/triggers/components/fetch-trigger/Node.tsx
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/BaseExecutionNode";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { FETCH_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/fetch-trigger";
import { fetchFetchTriggerRealtimeToken } from "./actions";
import { FetchTriggerDialog, type FetchTriggerValues } from "./Dialog";

export const FetchTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: FETCH_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchFetchTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: FetchTriggerValues) => {
    console.log("📄 [FetchNode] Received values:", values);
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          const updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
          console.log("✅ [FetchNode] Updated node data:", updatedNode.data);
          return updatedNode;
        }
        return node;
      }),
    );
  };

  const getDescription = () => {
    const data = props.data as FetchTriggerValues;
    if (data?.url) {
      return `Fetch: ${data.url}`;
    }
    return "Retrieve page content as clean markdown";
  };

  return (
    <>
      <FetchTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={props.data as FetchTriggerValues}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        icon="/logos/fetch.svg"
        name="Fetch"
        description={getDescription()}
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

FetchTriggerNode.displayName = "FetchTriggerNode";
