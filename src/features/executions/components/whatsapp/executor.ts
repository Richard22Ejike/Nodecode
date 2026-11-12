import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { whatsappChannel } from "@/inngest/channels/whatsapp";
import prisma from "@/lib/db";
import { compileTemplate } from "@/lib/handlebars-template";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

type WhatsAppData = {
  variableName?: string;
  credentialId?: string;
  phoneNumberId?: string;
  to?: string;
  content?: string;
};

export const whatsappExecutor: NodeExecutor<WhatsAppData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(whatsappChannel().status({ nodeId, status: "loading" }));

  if (!data.credentialId) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("WhatsApp node: credential is required");
  }
  if (!data.phoneNumberId?.trim()) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("WhatsApp node: Phone Number ID is required");
  }
  if (!data.content?.trim()) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("WhatsApp node: message content is required");
  }

  try {
    const to = compileTemplate(
      data.to?.trim() || "{{chatId}}",
      context,
      "WhatsApp node: failed to resolve recipient",
    );
    const content = compileTemplate(
      data.content,
      context,
      "WhatsApp node: failed to resolve message",
    );
    const phoneNumberId = compileTemplate(
      data.phoneNumberId,
      context,
      "WhatsApp node: failed to resolve Phone Number ID",
    );

    const credential = await step.run("get-whatsapp-credential", () =>
      prisma.credential.findUnique({
        where: { id: data.credentialId, userId },
      }),
    );
    if (!credential) {
      throw new NonRetriableError("WhatsApp node: credential not found");
    }

    const apiResult = await step.run(`whatsapp-send:${nodeId}`, async () =>
      sendWhatsAppMessage({
        credential: credential.value,
        phoneNumberId,
        to,
        text: content,
      }),
    );

    await publish(whatsappChannel().status({ nodeId, status: "success" }));

    const result = {
      sent: true,
      to,
      messageContent: content,
      apiResult,
    };

    return {
      ...context,
      whatsappSendResult: result,
      [data.variableName || "whatsappSendResult"]: result,
    };
  } catch (error) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
