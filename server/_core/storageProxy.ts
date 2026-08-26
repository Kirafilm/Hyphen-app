import type { Express } from "express";
import { storageRead } from "../storage";

/** Serve uploaded files from local disk at /uploads/* */
export function registerStorageProxy(app: Express) {
  app.get("/uploads/*", async (req, res) => {
    const key = (req.params as Record<string, string | undefined>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const file = await storageRead(key);
    if (!file) {
      res.status(404).send("Not found");
      return;
    }

    res.setHeader("Content-Type", file.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(file.buffer);
  });
}
