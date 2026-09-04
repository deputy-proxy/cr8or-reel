import express from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";

import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  renderMedia
} from "@remotion/renderer";

const app = express();

app.use(
  express.json({
    limit: "10mb",
    strict: true
  })
);

const PORT = Number(process.env.PORT || 3000);
const RENDER_SECRET = process.env.RENDER_SECRET || "";
const DEFAULT_CONCURRENCY = Number(process.env.RENDER_CONCURRENCY || 4);
const MAX_CONCURRENCY = 6;

const rootDir = process.cwd();

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "video-renderer",
    remotion: "4.0.520"
  });
});

app.post("/render", async (req, res) => {
  const startedAt = Date.now();

  try {
    if (RENDER_SECRET) {
      const suppliedSecret = req.get("x-render-secret") || "";

      if (
        !suppliedSecret ||
        suppliedSecret.length !== RENDER_SECRET.length ||
        !crypto.timingSafeEqual(
          Buffer.from(suppliedSecret),
          Buffer.from(RENDER_SECRET)
        )
      ) {
        return res.status(401).json({
          error: "Unauthorized"
        });
      }
    }

    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({
        error: "Invalid JSON body"
      });
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
    } = body;

    if (!background || typeof background !== "string") {
      return res.status(400).json({
        error: "background is required and must be a URL"
      });
    }

    if (!Array.isArray(elements)) {
      return res.status(400).json({
        error: "elements must be an array"
      });
    }

    const numericWidth = Number(width);
    const numericHeight = Number(height);
    const numericFps = Number(fps);
    const numericDuration = Number(duration);

    if (
      !Number.isFinite(numericWidth) ||
      !Number.isFinite(numericHeight) ||
      !Number.isFinite(numericFps) ||
      !Number.isFinite(numericDuration) ||
      numericWidth <= 0 ||
      numericHeight <= 0 ||
      numericFps <= 0 ||
      numericDuration <= 0
    ) {
      return res.status(400).json({
        error: "width, height, fps and duration must be positive numbers"
      });
    }

    if (outputFormat !== "mp4") {
      return res.status(400).json({
        error: "Only mp4 output is currently supported"
      });
    }

    const durationInFrames = Math.max(
      1,
      Math.round(numericDuration * numericFps)
    );

    const workDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "video-renderer-")
    );

    const outputLocation = path.join(workDir, "output.mp4");

    try {
      const entryPoint = path.join(rootDir, "src", "index.jsx");

      const serveUrl = await bundle({
        entryPoint,
        webpackOverride: (config) => config
      });

      const inputProps = {
        background,
        elements,
        width: numericWidth,
        height: numericHeight,
        fps: numericFps,
        duration: numericDuration
      };

      const compositions = await getCompositions(serveUrl, {
        inputProps
      });

      const composition = compositions.find(
        (item) => item.id === compositionId
      );

      if (!composition) {
        throw new Error(
          `Composition "${compositionId}" was not found`
        );
      }

      const actualComposition = {
        ...composition,
        width: numericWidth,
        height: numericHeight,
        fps: numericFps,
        durationInFrames
      };

      const concurrency = Math.min(
        Math.max(1, DEFAULT_CONCURRENCY),
        MAX_CONCURRENCY
      );

      await renderMedia({
        composition: actualComposition,
        serveUrl,
        codec: "h264",
        outputLocation,
        inputProps,
        concurrency,
        chromiumOptions: {
          disableWebSecurity: true
        }
      });

      const stat = await fs.stat(outputLocation);

      if (!stat.size) {
        throw new Error("Renderer produced an empty output file");
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="render.mp4"'
      );
      res.setHeader("Content-Length", stat.size);
      res.setHeader("X-Render-Duration-Ms", String(Date.now() - startedAt));

      const file = await fs.readFile(outputLocation);
      return res.send(file);
    } finally {
      await fs.rm(workDir, {
        recursive: true,
        force: true
      });
    }
  } catch (error) {
    console.error("Rendering failed:", error);

    return res.status(500).json({
      error: "Rendering failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error("Request parsing failed:", err);

  return res.status(400).json({
    error: "Bad request",
    message: err instanceof Error ? err.message : String(err)
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Video renderer listening on port ${PORT}`);
});
