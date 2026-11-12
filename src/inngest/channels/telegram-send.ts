import { channel, topic } from "@inngest/realtime";

export const TELEGRAM_SEND_CHANNEL_NAME = "telegram-send-execution";

export const telegramSendChannel = channel(TELEGRAM_SEND_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
