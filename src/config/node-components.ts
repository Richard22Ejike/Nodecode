// src/config/node-components.ts

import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "@/components/initial-node";
import {
  ActNode,
  AgentNode,
  ExtractNode,
  ObserveNode,
  OpenUrlNode,
  SendEmailNode,
} from "@/features/executions/components/browser/nodes";
import { DiscordNode } from "@/features/executions/components/discord/Discord";
import { GeminiNode } from "@/features/executions/components/gemini/GeminiNode";
import { HTTPRequestNode } from "@/features/executions/components/http-request/HTTPRequestNode";
import { OpenAINode } from "@/features/executions/components/openai/OpenAINode";
import { ScriptNode } from "@/features/executions/components/script/ScriptNode";
import { SlackNode } from "@/features/executions/components/slack/Slack";
import { TelegramSendNode } from "@/features/executions/components/telegram-send/TelegramSendNode";
import { WhatsAppNode } from "@/features/executions/components/whatsapp/WhatsAppNode";
// Import the new trigger nodes
import { BrowseTriggerNode } from "@/features/triggers/components/browse-trigger/Node";
import { FetchTriggerNode } from "@/features/triggers/components/fetch-trigger/Node";
import { GoogleFormTriggerNode } from "@/features/triggers/components/google-form-trigger/GoogleFormTriggerNode";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/ManualTriggerNode";
import { SearchTriggerNode } from "@/features/triggers/components/search-trigger/Node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/StripeTriggerNode";
import { TelegramTriggerNode } from "@/features/triggers/components/telegram-trigger/TelegramTriggerNode";
import { WhatsAppTriggerNode } from "@/features/triggers/components/whatsapp-trigger/WhatsAppTriggerNode";
import { NodeType } from "@/generated/prisma/enums";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HTTPRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTriggerNode,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
  [NodeType.GEMINI]: GeminiNode,
  [NodeType.OPENAI]: OpenAINode,
  [NodeType.DISCORD]: DiscordNode,
  [NodeType.SLACK]: SlackNode,
  [NodeType.TELEGRAM]: TelegramTriggerNode,
  [NodeType.TELEGRAM_SEND]: TelegramSendNode,
  [NodeType.WHATSAPP_TRIGGER]: WhatsAppTriggerNode,
  [NodeType.WHATSAPP]: WhatsAppNode,
  // Add the new nodes
  [NodeType.BROWSE_TRIGGER]: BrowseTriggerNode,
  [NodeType.FETCH_TRIGGER]: FetchTriggerNode,
  [NodeType.SEARCH_TRIGGER]: SearchTriggerNode,
  [NodeType.SCRIPT]: ScriptNode,
  [NodeType.OPEN_URL]: OpenUrlNode,
  [NodeType.ACT]: ActNode,
  [NodeType.OBSERVE]: ObserveNode,
  [NodeType.EXTRACT]: ExtractNode,
  [NodeType.AGENT]: AgentNode,
  [NodeType.SEND_EMAIL]: SendEmailNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
