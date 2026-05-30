import * as Api from "@/lib/_core/api";
import { getApiBaseUrl } from "@/constants/oauth";

export type ContactEmailPayload = {
  contactName: string;
  email: string;
  message: string;
};

function formatContactError(message: string): string {
  if (message.includes("non-browser environments")) {
    return "EmailJS 尚未允許 App 呼叫 API。請到 EmailJS 後台 → Account → Security，開啟「Allow EmailJS API for non-browser applications」後再試。";
  }
  if (message.includes("strict mode") || message.includes("Private Key") || message.includes("EMAILJS_PRIVATE_KEY")) {
    return "EmailJS Private Key 未正確設定。請在 VPS 的 /opt/hyphen-app/.env 加入真實 EMAILJS_PRIVATE_KEY，然後執行：sudo docker compose -f docker-compose.prod.yml up -d --force-recreate api";
  }
  if (message.includes("placeholder") || message.includes("looks invalid")) {
    return "EMAILJS_PRIVATE_KEY 仍是示例值或無效。請到 EmailJS → Account → API Keys 複製真實 Private Key 到 VPS .env，再 force-recreate api。";
  }
  return message;
}

/**
 * Sends contact form via our API server (which calls EmailJS).
 * Avoids calling EmailJS directly from React Native / non-browser clients.
 */
export async function sendContactEmail(payload: ContactEmailPayload): Promise<void> {
  try {
    await Api.apiCall<{ ok: boolean }>("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "傳送失敗";
    throw new Error(formatContactError(message));
  }
}

export function isEmailJsConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}
