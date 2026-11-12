// src/features/triggers/components/search-trigger/actions.ts
"use server";

import type { Realtime } from "@inngest/realtime";
import { searchTriggerChannel } from "@/inngest/channels/search-trigger";
import { getRealtimeToken } from "@/lib/realtime-token";

export type SearchTriggerToken = Realtime.Subscribe.Token;

export async function fetchSearchTriggerRealtimeToken(): Promise<SearchTriggerToken> {
  return getRealtimeToken(searchTriggerChannel, ["status"]);
}
