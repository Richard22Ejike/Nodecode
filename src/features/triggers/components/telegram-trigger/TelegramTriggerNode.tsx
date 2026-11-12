import type { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { TELEGRAM_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/telegram_trigger";
import { BaseTriggerNode } from "../BaseTriggerNode";
import { fetchTelegramTriggerRealtimeToken } from "./actions";
import { TelegramTriggerDialog } from "./Dialog";

export const TelegramTriggerNode = memo((props: NodeProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: TELEGRAM_TRIGGER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchTelegramTriggerRealtimeToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  return (
    <>
      <TelegramTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <BaseTriggerNode
        {...props}
        icon="/logos/telegram.svg"
        name="Telegram"
        description="When Telegram Bot is Triggered"
        status={nodeStatus}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});
