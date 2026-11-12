// src/lib/realtime-token.ts
"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";

export async function getRealtimeToken(
  channel: Realtime.Channel,
  topics: string[],
): Promise<Realtime.Subscribe.Token> {
  try {
    // Check if we have the necessary configuration
    if (!process.env.INNGEST_EVENT_KEY) {
      console.warn("INNGEST_EVENT_KEY not set, using mock token");
      return {
        token: `mock-token-${channel.name}`,
        topics: topics,
        channel: channel,
      } as unknown as Realtime.Subscribe.Token;
    }

    const token = await getSubscriptionToken(inngest, {
      channel,
      topics,
    });
    return token;
  } catch (error) {
    console.error("Failed to get subscription token:", error);
    return {
      token: `mock-token-${channel.name}`,
      topics: topics,
      channel: channel,
    } as unknown as Realtime.Subscribe.Token;
  }
}
