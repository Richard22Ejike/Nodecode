import { type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { WHATSAPP_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/whatsapp-trigger";
import { BaseTriggerNode } from "../BaseTriggerNode";
import { fetchWhatsAppTriggerRealtimeToken } from "./actions";
import { WhatsAppTriggerDialog } from "./Dialog";

export const WhatsAppTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { updateNodeData } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: WHATSAPP_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchWhatsAppTriggerRealtimeToken,
  });

  const data = props.data as { verifyToken?: string };

  return (
    <>
      <WhatsAppTriggerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultValues={data}
        onSubmit={(values) => updateNodeData(props.id, values)}
      />
      <BaseTriggerNode
        {...props}
        icon="/logos/whatsapp.svg"
        name="WhatsApp"
        description="When a WhatsApp message is received"
        status={nodeStatus}
        onSettings={() => setDialogOpen(true)}
        onDoubleClick={() => setDialogOpen(true)}
      />
    </>
  );
});

WhatsAppTriggerNode.displayName = "WhatsAppTriggerNode";
