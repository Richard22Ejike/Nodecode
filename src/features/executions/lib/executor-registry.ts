// src/features/executions/lib/executor-registry.ts

import { NonRetriableError } from "inngest";
import { browseTriggerExecutor } from "@/features/triggers/components/browse-trigger/executor";
import { fetchTriggerExecutor } from "@/features/triggers/components/fetch-trigger/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/components/google-form-trigger/executor";
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { searchTriggerExecutor } from "@/features/triggers/components/search-trigger/executor";
import { stripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";
import { telegramTriggerExecutor } from "@/features/triggers/components/telegram-trigger/executor";
import { whatsappTriggerExecutor } from "@/features/triggers/components/whatsapp-trigger/executor";
import { NodeType } from "@/generated/prisma/enums";
import { actExecutor } from "../components/act/executor";
import { agentExecutor } from "../components/agent/executor";
import { discordExecutor } from "../components/discord/executor";
import { extractExecutor } from "../components/extract/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { HTTPRequestExecutor } from "../components/http-request/executor";
import { observeExecutor } from "../components/observe/executor";
import { openUrlExecutor } from "../components/open-url/executor";
import { openAIExecutor } from "../components/openai/executor";
import { scriptExecutor } from "../components/script/executor";
import { sendEmailExecutor } from "../components/send-email/executor";
import { slackExecutor } from "../components/slack/executor";
import { telegramSendExecutor } from "../components/telegram-send/executor";
import { whatsappExecutor } from "../components/whatsapp/executor";
import type { NodeExecutor } from "../types";

export const executorRegistry: Record<NodeType, NodeExecutor> = {
  [NodeType.INITIAL]: manualTriggerExecutor as NodeExecutor,
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor as NodeExecutor,
  [NodeType.HTTP_REQUEST]: HTTPRequestExecutor as NodeExecutor,
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor as NodeExecutor,
  [NodeType.STRIPE_TRIGGER]: stripeTriggerExecutor as NodeExecutor,
  [NodeType.GEMINI]: geminiExecutor as NodeExecutor,
  [NodeType.OPENAI]: openAIExecutor as NodeExecutor,
  [NodeType.DISCORD]: discordExecutor as NodeExecutor,
  [NodeType.SLACK]: slackExecutor as NodeExecutor,
  [NodeType.TELEGRAM]: telegramTriggerExecutor as NodeExecutor,
  [NodeType.TELEGRAM_SEND]: telegramSendExecutor as NodeExecutor,
  [NodeType.WHATSAPP_TRIGGER]: whatsappTriggerExecutor as NodeExecutor,
  [NodeType.WHATSAPP]: whatsappExecutor as NodeExecutor,
  [NodeType.BROWSE_TRIGGER]: browseTriggerExecutor as NodeExecutor,
  [NodeType.FETCH_TRIGGER]: fetchTriggerExecutor as NodeExecutor,
  [NodeType.SEARCH_TRIGGER]: searchTriggerExecutor as NodeExecutor,
  [NodeType.SCRIPT]: scriptExecutor as NodeExecutor,
  [NodeType.OPEN_URL]: openUrlExecutor as NodeExecutor,
  [NodeType.ACT]: actExecutor as NodeExecutor,
  [NodeType.OBSERVE]: observeExecutor as NodeExecutor,
  [NodeType.EXTRACT]: extractExecutor as NodeExecutor,
  [NodeType.AGENT]: agentExecutor as NodeExecutor,
  [NodeType.SEND_EMAIL]: sendEmailExecutor as NodeExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new NonRetriableError(`No executor found for node type: ${type}`);
  }
  return executor;
};
