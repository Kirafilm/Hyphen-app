export type ContactEmailPayload = {
  contactName: string;
  email: string;
  message: string;
};

function getEmailJsConfig() {
  const serviceId = (
    process.env.EMAILJS_SERVICE_ID ??
    process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID ??
    ""
  ).trim();
  const templateId = (
    process.env.EMAILJS_TEMPLATE_ID ??
    process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID ??
    ""
  ).trim();
  const publicKey = (
    process.env.EMAILJS_PUBLIC_KEY ??
    process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY ??
    ""
  ).trim();
  const privateKey = (process.env.EMAILJS_PRIVATE_KEY ?? "").trim();

  if (!serviceId || !templateId || !publicKey) return null;
  return { serviceId, templateId, publicKey, privateKey };
}

const PLACEHOLDER_PRIVATE_KEYS = new Set([
  "",
  "your_private_key",
  "change_me",
  "your-public-key",
  "your_public_key",
]);

function isValidPrivateKey(privateKey: string): boolean {
  return privateKey.length >= 8 && !PLACEHOLDER_PRIVATE_KEYS.has(privateKey.toLowerCase());
}

export function isEmailJsConfiguredOnServer(): boolean {
  const config = getEmailJsConfig();
  if (!config) return false;
  return isValidPrivateKey(config.privateKey);
}

export function getEmailJsServerStatus() {
  const config = getEmailJsConfig();
  if (!config) {
    return { configured: false, hasService: false, hasTemplate: false, hasPublicKey: false, hasPrivateKey: false };
  }
  return {
    configured: isValidPrivateKey(config.privateKey),
    hasService: Boolean(config.serviceId),
    hasTemplate: Boolean(config.templateId),
    hasPublicKey: Boolean(config.publicKey),
    hasPrivateKey: isValidPrivateKey(config.privateKey),
    privateKeyLength: config.privateKey.length,
  };
}

export async function sendContactEmailOnServer(payload: ContactEmailPayload): Promise<void> {
  const config = getEmailJsConfig();
  if (!config) {
    throw new Error("EmailJS is not configured on the server");
  }
  if (!config.privateKey) {
    throw new Error(
      "API access in strict mode, but no Private Key was provided. Add EMAILJS_PRIVATE_KEY to .env (EmailJS → Account → API Keys).",
    );
  }
  if (!isValidPrivateKey(config.privateKey)) {
    throw new Error(
      "EMAILJS_PRIVATE_KEY looks invalid or is still a placeholder. Copy the real Private Key from EmailJS → Account → API Keys.",
    );
  }

  const body: Record<string, unknown> = {
    lib_version: "4.0.0",
    user_id: config.publicKey,
    service_id: config.serviceId,
    template_id: config.templateId,
    accessToken: config.privateKey,
    template_params: {
      // App field names
      contact_name: payload.contactName,
      contact_email: payload.email,
      message: payload.message,
      reply_to: payload.email,
      // Common EmailJS template aliases (e.g. {{name}}, {{email}}, {{message}})
      name: payload.contactName,
      user_name: payload.contactName,
      from_name: payload.contactName,
      to_name: payload.contactName,
      email: payload.email,
      user_email: payload.email,
      from_email: payload.email,
      to_email: payload.email,
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[EmailJS] send failed:", response.status, text);
    throw new Error(text || `EmailJS send failed (${response.status})`);
  }
}
