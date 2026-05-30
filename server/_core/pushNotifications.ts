import * as db from "../db";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const BATCH_SIZE = 100;

type NewJobNotification = {
  id: string;
  title: string;
  category: string;
  createdByUserId: number;
};

async function sendExpoPushBatch(
  messages: Array<{ to: string; title: string; body: string; data: Record<string, string> }>,
) {
  if (messages.length === 0) return;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        chunk.map((msg) => ({
          to: msg.to,
          sound: "default",
          title: msg.title,
          body: msg.body,
          data: msg.data,
        })),
      ),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[Push] Expo send failed:", response.status, text);
    }
  }
}

export async function notifyNewJobPosted(job: NewJobNotification): Promise<void> {
  const tokens = await db.listPushTokensForJobAlerts(job.createdByUserId);
  console.log(`[Push] new job "${job.title}" → ${tokens.length} device(s)`);
  if (tokens.length === 0) return;

  await sendExpoPushBatch(
    tokens.map((token) => ({
      to: token,
      title: "有新工作發佈",
      body: `${job.title} · ${job.category}`,
      data: { jobId: job.id, type: "new_job" },
    })),
  );
}
