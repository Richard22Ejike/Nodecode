// src/features/triggers/components/browse-trigger/actions.ts
"use server";

import type { Realtime } from "@inngest/realtime";
import { browseTriggerChannel } from "@/inngest/channels/browse-trigger";

export type BrowseTriggerToken = Realtime.Subscribe.Token;

export async function fetchBrowseTriggerRealtimeToken(): Promise<BrowseTriggerToken> {
  // Return a mock token that matches the expected structure
  return {
    token: "mock-token-browse-trigger",
    topics: ["status"],
    channel: browseTriggerChannel, // Use the channel object, not just the string
  } as unknown as BrowseTriggerToken;
}
