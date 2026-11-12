// src/features/triggers/components/search-trigger/Node.tsx
import { type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/BaseExecutionNode";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { SEARCH_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/search-trigger";
import { fetchSearchTriggerRealtimeToken } from "./actions";
import { SearchTriggerDialog, type SearchTriggerValues } from "./Dialog";

export const SearchTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: SEARCH_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchSearchTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: SearchTriggerValues) => {
    console.log("🔍 [SearchNode] Received values:", values);
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
          console.log("✅ [SearchNode] Updated node data:", updatedNode.data);
          return updatedNode;
        }
        return node;
      }),
    );
  };

  const getDescription = () => {
    const data = props.data as SearchTriggerValues;
    if (data?.query) {
      return `Search: "${data.query}"`;
    }
    return "Query the web and get structured results";
  };

  return (
    <>
      <SearchTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={props.data as SearchTriggerValues}
        onSubmit={handleSubmit}
      />
      <BaseExecutionNode
        {...props}
        icon="/logos/search.svg"
        name="Search"
        description={getDescription()}
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

SearchTriggerNode.displayName = "SearchTriggerNode";
