import type { Messages } from "./types";

export function getMessage(messages: Messages, path: string): string {
  const parts = path.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current == null || typeof current !== "object" || !(part in current)) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

export function translateCategory(messages: Messages, key: string): string {
  return messages.categories[key]?.name ?? key;
}

export function translateLocation(messages: Messages, key: string): string {
  return messages.locations[key] ?? key;
}

export function translateScheduleWindow(messages: Messages, key: string): string {
  return messages.scheduleWindows[key] ?? key;
}

export function formatMessage(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}
