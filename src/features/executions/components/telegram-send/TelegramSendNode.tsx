import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { TELEGRAM_SEND_CHANNEL_NAME } from "@/inngest/channels/telegram-send";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../BaseExecutionNode";
import { fetchTelegramSendRealtimeToken } from "./actions";
import { TelegramSendDialog, type TelegramSendFormValues } from "./Dialog";

type TelegramSendNodeData = Partial<TelegramSendFormValues>;
type TelegramSendNodeType = Node<TelegramSendNodeData>;

export const TelegramSendNode = memo(
  (props: NodeProps<TelegramSendNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { setNodes } = useReactFlow();

    const nodeStatus = useNodeStatus({
      nodeId: props.id,
      channel: TELEGRAM_SEND_CHANNEL_NAME,
      topic: "status",
      refreshToken: fetchTelegramSendRealtimeToken,
    });

    const handleSubmit = (values: TelegramSendFormValues) => {
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
      : "Send a Telegram message";

    return (
      <>
        <TelegramSendDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={props.data}
        />
        <BaseExecutionNode
          {...props}
          icon="/logos/telegram.svg"
          name="Telegram Message"
          description={description}
          status={nodeStatus}
          onSettings={() => setDialogOpen(true)}
          onDoubleClick={() => setDialogOpen(true)}
        />
      </>
    );
  },
);

TelegramSendNode.displayName = "TelegramSendNode";
