import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  renderMedia,
} from "@remotion/renderer";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 3000);
const RENDER_SECRET = process.env.RENDER_SECRET || "";

let bundleLocationPromise;

function getBundleLocation() {
  if (!bundleLocationPromise) {
    bundleLocationPromise = bundle({
      entryPoint: path.resolve("/app/src/remotion-entry.jsx"),
      webpackOverride: (config) => config,
    });
  }
  return bundleLocationPromise;
}

function authorized(req) {
  if (!RENDER_SECRET) return true;
  return req.get("x-render-secret") === RENDER_SECRET;
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "video-renderer",
    remotion: "4.0.0"
  });
});

app.post("/render", async (req, res) => {
  if (!authorized(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    background,
    elements = [],
    width = 1080,
    height = 1920,
    fps = 30,
    duration = 30,
    compositionId = "Video",
    outputFormat = "mp4"
  } = req.body || {};

  if (!background) {
    return res.status(400).json({ error: "background is required" });
  }

  if (!["mp4", "webm"].includes(outputFormat)) {
    return res.status(400).json({ error: "outputFormat must be mp4 or webm" });
  }

  if (!Number.isFinite(width) || !Number.isFinite(height) ||
      !Number.isFinite(fps) || !Number.isFinite(duration)) {
    return res.status(400).json({ error: "Invalid dimensions, fps, or duration" });
  }

  const jobId = crypto.randomUUID();
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `render-${jobId}-`));
  const outputPath = path.join(workDir, `render.${outputFormat}`);

  try {
    const serveUrl = await getBundleLocation();

    const compositions = await getCompositions(serveUrl, {
      inputProps: {
        background,
        elements,
        width,
        height,
        fps,
        duration
      }
    });

    const composition = compositions.find((c) => c.id === compositionId);
    if (!composition) {
      return res.status(400).json({
        error: `Composition "${compositionId}" was not found`,
        available: compositions.map((c) => c.id)
      });
    }

    const durationInFrames = Math.max(1, Math.round(duration * fps));

    await renderMedia({
      composition: {
        ...composition,
        width: Number(width),
        height: Number(height),
        fps: Number(fps),
        durationInFrames
      },
      serveUrl,
      codec: outputFormat === "webm" ? "vp8" : "h264",
      outputLocation: outputPath,
      inputProps: {
        background,
        elements,
        width: Number(width),
        height: Number(height),
        fps: Number(fps),
        duration: Number(duration)
      },
      concurrency: Math.max(1, Math.min(6, Number(process.env.RENDER_CONCURRENCY || 4))),
      chromiumOptions: {
        disableWebSecurity: true
      }
    });

    // For production, replace this with an upload to S3/R2/etc.
    // This starter returns the rendered file directly.
    res.setHeader("Content-Type", outputFormat === "webm" ? "video/webm" : "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${jobId}.${outputFormat}"`);
    const file = await fs.readFile(outputPath);
    res.send(file);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Rendering failed",
        message: error?.message || String(error)
      });
    }
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Video renderer listening on port ${PORT}`);
});