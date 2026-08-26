const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_RE = /(?:\+?\d[\d\s\-().]{6,}\d|\b\d{8,}\b)/;
const URL_RE = /(?:https?:\/\/|www\.)[^\s]+/i;
const CONTACT_KEYWORDS =
  /\b(whatsapp|telegram|wechat|微信|line\s*id|instagram|facebook|fb\.com|linkedin|電話|手機|phone|mobile|email|電郵|聯絡方式)\b/i;

export type ContactViolation = "email" | "phone" | "url" | "keyword";

export function detectContactInfo(text: string): ContactViolation | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (EMAIL_RE.test(trimmed)) return "email";
  if (PHONE_RE.test(trimmed)) return "phone";
  if (URL_RE.test(trimmed)) return "url";
  if (CONTACT_KEYWORDS.test(trimmed)) return "keyword";
  return null;
}

export function assertNoContactInfo(text: string, fieldLabel: string): void {
  const violation = detectContactInfo(text);
  if (!violation) return;
  throw new Error(`${fieldLabel} 不可包含個人聯絡方式（電郵、電話、網址或外部通訊帳號）。請使用 Hyphen 訊息功能聯絡。`);
}

export function parseTagList(raw: string): string[] {
  return raw
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
}
