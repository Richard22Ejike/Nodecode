import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { WHATSAPP_CHANNEL_NAME } from "@/inngest/channels/whatsapp";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../BaseExecutionNode";
import { fetchWhatsAppRealtimeToken } from "./actions";
import { WhatsAppDialog, type WhatsAppFormValues } from "./Dialog";

type WhatsAppNodeData = Partial<WhatsAppFormValues>;
type WhatsAppNodeType = Node<WhatsAppNodeData>;

export const WhatsAppNode = memo((props: NodeProps<WhatsAppNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: WHATSAPP_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchWhatsAppRealtimeToken,
  });

  const handleSubmit = (values: WhatsAppFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === props.id
          ? { ...node, data: { ...node.data, ...values } }
          : node,
      ),
    );
  };

  const description = props.data?.content
    ? `Send: ${String(props.data.content).slice(0, 50)}`
    : "Send a WhatsApp message";

  return (
    <>
      <WhatsAppDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data}
      />
      <BaseExecutionNode
        {...props}
        icon="/logos/whatsapp.svg"
        name="WhatsApp Message"
        description={description}
        status={nodeStatus}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

WhatsAppNode.displayName = "WhatsAppNode";
