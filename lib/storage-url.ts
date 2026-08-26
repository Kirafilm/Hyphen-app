import { getApiBaseUrl } from "@/constants/oauth";

/** Public URL for a stored upload key (local disk via API /uploads). */
export function storagePublicUrl(storageKey: string): string {
  const key = storageKey.replace(/^\/+/, "").replace(/^uploads\//, "");
  return `${getApiBaseUrl()}/uploads/${key}`;
}
