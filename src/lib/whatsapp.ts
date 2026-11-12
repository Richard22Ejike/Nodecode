import ky from "ky";
import { decrypt } from "./encryption";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

type SendWhatsAppParams = {
  credential: string;
  phoneNumberId: string;
  to: string;
  text: string;
};

export function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export async function sendWhatsAppMessage({
  credential,
  phoneNumberId,
  to,
  text,
}: SendWhatsAppParams) {
  const accessToken = decrypt(credential);
  if (!accessToken) {
    throw new Error("Failed to decrypt WhatsApp access token from credential");
  }

  const recipient = normalizeWhatsAppNumber(to);
  if (!recipient) {
    throw new Error("WhatsApp recipient phone number is empty");
  }

  return ky
    .post(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      json: {
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: text, preview_url: false },
      },
      timeout: 15_000,
      retry: 0,
    })
    .json();
}
