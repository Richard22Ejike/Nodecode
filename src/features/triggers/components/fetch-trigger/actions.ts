// src/features/triggers/components/fetch-trigger/actions.ts
"use server";

import type { Realtime } from "@inngest/realtime";
import { fetchTriggerChannel } from "@/inngest/channels/fetch-trigger";
import { getRealtimeToken } from "@/lib/realtime-token";

export type FetchTriggerToken = Realtime.Subscribe.Token;

export async function fetchFetchTriggerRealtimeToken(): Promise<FetchTriggerToken> {
  return getRealtimeToken(fetchTriggerChannel, ["status"]);
}
