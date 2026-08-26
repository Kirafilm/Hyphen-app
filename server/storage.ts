/**
 * Local file storage for Hyphen.
 * Files live under STORAGE_DIR and are served at /uploads/{key}.
 */
import { createHash, randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DEFAULT_STORAGE_DIR = path.resolve(process.cwd(), "data", "uploads");

function storageRoot(): string {
  const raw = process.env.STORAGE_DIR?.trim();
  return raw && raw.length > 0 ? path.resolve(raw) : DEFAULT_STORAGE_DIR;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "").replace(/^uploads\//, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function assertSafeKey(key: string): string {
  const normalized = normalizeKey(key);
  if (!normalized || normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

function absolutePathForKey(key: string): string {
  const safe = assertSafeKey(key);
  const root = storageRoot();
  const full = path.resolve(root, safe);
  if (!full.startsWith(root + path.sep) && full !== root) {
    throw new Error("Invalid storage path");
  }
  return full;
}

function contentTypeFromKey(key: string): string {
  const ext = path.extname(key).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "application/octet-stream";
}

export function getStorageRoot(): string {
  return storageRoot();
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  void contentType;
  const key = appendHashSuffix(normalizeKey(relKey));
  const fullPath = absolutePathForKey(key);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);

  await fs.writeFile(fullPath, buffer);
  return { key, url: `/uploads/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = assertSafeKey(relKey);
  return { key, url: `/uploads/${key}` };
}

/** Local files are served directly; no signed URL needed. */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const { url } = await storageGet(relKey);
  return url;
}

export async function storageRead(relKey: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const key = assertSafeKey(relKey);
    const fullPath = absolutePathForKey(key);
    const buffer = await fs.readFile(fullPath);
    return { buffer, contentType: contentTypeFromKey(key) };
  } catch {
    return null;
  }
}

export async function storageDelete(relKey: string): Promise<boolean> {
  try {
    const fullPath = absolutePathForKey(relKey);
    await fs.unlink(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function storageSha256(relKey: string): Promise<string | null> {
  const file = await storageRead(relKey);
  if (!file) return null;
  return createHash("sha256").update(file.buffer).digest("hex");
}
