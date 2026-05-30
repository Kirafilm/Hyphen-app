import type { Express } from "express";
import { z } from "zod";
import { getEmailJsServerStatus, isEmailJsConfiguredOnServer, sendContactEmailOnServer } from "./emailjs";

const contactBodySchema = z.object({
  contactName: z.string().trim().min(1, "contactName is required"),
  email: z.string().trim().email("Invalid email"),
  message: z.string().trim().min(1, "message is required"),
});

function formatContactError(message: string): string {
  if (message.includes("non-browser environments")) {
    return "EmailJS 尚未允許 App 呼叫 API。請到 EmailJS 後台 → Account → Security，開啟「Allow EmailJS API for non-browser applications」。";
  }
  if (message.includes("strict mode") || message.includes("Private Key")) {
    return "EmailJS 已啟用 Strict Mode，請在伺服器 .env 加入 EMAILJS_PRIVATE_KEY（EmailJS → Account → API Keys → Private Key），然後重啟 API。";
  }
  return message;
}

export function registerContactRoute(app: Express) {
  app.get("/api/contact/status", (_req, res) => {
    res.json(getEmailJsServerStatus());
  });

  app.post("/api/contact", async (req, res) => {
    try {
      if (!isEmailJsConfiguredOnServer()) {
        res.status(503).json({ error: "EmailJS 尚未在伺服器設定" });
        return;
      }

      const body = contactBodySchema.parse(req.body);
      await sendContactEmailOnServer({
        contactName: body.contactName,
        email: body.email,
        message: body.message,
      });

      res.json({ ok: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.issues[0]?.message ?? "Invalid request" });
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to send contact email";
      console.error("[contact] EmailJS error:", message);
      res.status(502).json({ error: formatContactError(message) });
    }
  });
}
