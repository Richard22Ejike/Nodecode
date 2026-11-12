"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { telegramSendChannel } from "@/inngest/channels/telegram-send";
import { inngest } from "@/inngest/client";

export type TelegramSendToken = Realtime.Token<
  typeof telegramSendChannel,
  ["status"]
>;

export async function fetchTelegramSendRealtimeToken(): Promise<TelegramSendToken> {
  return getSubscriptionToken(inngest, {
    channel: telegramSendChannel(),
    topics: ["status"],
  });
}
