import express, { type Express } from "express";
import fs from "fs";
import path from "path";

function resolveWebAssetsDir(): string {
  const bundled = path.join(process.cwd(), "web-assets");
  if (fs.existsSync(path.join(bundled, "hero-front-page.png"))) return bundled;
  return path.join(process.cwd(), "assets/images");
}

export function registerWebAssets(app: Express) {
  app.use(
    "/web-assets",
    express.static(resolveWebAssetsDir(), {
      maxAge: "7d",
    }),
  );
}
