// src/features/executions/components/script/actions.ts
"use server";

import type { Realtime } from "@inngest/realtime";
import { scriptChannel } from "@/inngest/channels/script";
import { getRealtimeToken } from "@/lib/realtime-token";

export type ScriptToken = Realtime.Subscribe.Token;

export async function fetchScriptRealtimeToken(): Promise<ScriptToken> {
  return getRealtimeToken(scriptChannel, ["status"]);
}
