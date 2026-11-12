import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { telegramSendChannel } from "@/inngest/channels/telegram-send";
import prisma from "@/lib/db";
import { compileTemplate } from "@/lib/handlebars-template";
import { sendTelegramMessage } from "@/lib/telegram";

type TelegramSendData = {
  variableName?: string;
  credentialId?: string;
  chatId?: string;
  content?: string;
};

export const telegramSendExecutor: NodeExecutor<TelegramSendData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(telegramSendChannel().status({ nodeId, status: "loading" }));

  if (!data.credentialId) {
    await publish(telegramSendChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Telegram send node: credential is required");
  }
  if (!data.content?.trim()) {
    await publish(telegramSendChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Telegram send node: message content is required",
    );
  }

  try {
    const chatId = compileTemplate(
      data.chatId?.trim() || "{{chatId}}",
      context,
      "Telegram send node: failed to resolve chat ID",
    );
    const content = compileTemplate(
      data.content,
      context,
      "Telegram send node: failed to resolve message",
    );

    const credential = await step.run("get-telegram-credential", () =>
      prisma.credential.findUnique({
        where: { id: data.credentialId, userId },
      }),
    );
    if (!credential) {
      throw new NonRetriableError("Telegram send node: credential not found");
    }

    const apiResult = await step.run(`telegram-send:${nodeId}`, async () =>
      sendTelegramMessage({
        credential: credential.value,
        chatId,
        text: content,
      }),
    );

    await publish(telegramSendChannel().status({ nodeId, status: "success" }));

    const result = {
      sent: true,
      chatId,
      messageContent: content,
      apiResult,
    };

    return {
      ...context,
      telegramSendResult: result,
      [data.variableName || "telegramSendResult"]: result,
    };
  } catch (error) {
    await publish(telegramSendChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
