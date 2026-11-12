// src/features/executions/components/send-email/executor.ts
import { NonRetriableError } from "inngest";
import { Resend } from "resend";
import type { NodeExecutor } from "@/features/executions/types";
import { renderRequired } from "../browser/shared";

type SendEmailData = {
  variableName?: string;
  to?: string;
  subject?: string;
  body?: string;
};

export const sendEmailExecutor: NodeExecutor<SendEmailData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new NonRetriableError(
      "Send Email node: RESEND_API_KEY is not set in the environment",
    );
  }

  const to = renderRequired(data.to, context, "Send Email node: recipient")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const subject = renderRequired(
    data.subject,
    context,
    "Send Email node: subject",
  );
  const body = renderRequired(data.body, context, "Send Email node: body");

  if (to.length === 0) {
    throw new NonRetriableError("Send Email node: recipient is required");
  }

  const result = await step.run(`send-email:${nodeId}`, async () => {
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      // Until you verify your own domain in Resend, only this sender works
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to,
      subject,
      text: body,
      ...(/<[a-z][\s\S]*>/i.test(body) ? { html: body } : {}),
    });

    // Resend returns errors instead of throwing; throw so the run marks this
    // node as failed rather than looking successful when nothing was sent.
    if (error || !sent) {
      throw new Error(
        `Resend failed to send the email: ${error?.message ?? "no response"}`,
      );
    }
    return { id: sent.id };
  });

  return { ...context, [data.variableName || "email"]: result };
};
