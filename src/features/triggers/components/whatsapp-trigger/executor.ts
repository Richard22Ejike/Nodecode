import type { NodeExecutor } from "@/features/executions/types";
import { whatsappTriggerChannel } from "@/inngest/channels/whatsapp-trigger";

type WhatsAppTriggerData = Record<string, unknown>;

export const whatsappTriggerExecutor: NodeExecutor<
  WhatsAppTriggerData
> = async ({ nodeId, context, step, publish }) => {
  await publish(whatsappTriggerChannel().status({ nodeId, status: "loading" }));

  try {
    const result = await step.run(`whatsapp-trigger:${nodeId}`, async () => {
      const incoming = {
        text: context.text,
        chatId: context.chatId,
        from: context.from,
        contactName: context.contactName,
        messageId: context.messageId,
      };
      return {
        ...context,
        whatsappResult: incoming,
      };
    });

    await publish(
      whatsappTriggerChannel().status({ nodeId, status: "success" }),
    );
    return result;
  } catch (error) {
    await publish(whatsappTriggerChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
