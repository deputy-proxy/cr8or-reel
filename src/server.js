import express from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import crypto from "crypto";

import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

import {
  getTemplate,
  listTemplates,
  saveTemplate,
  resolveObject
} from "./template-system.js";

const app = express();

app.use(express.json({ limit: "10mb", strict: true }));
app.use(express.static(path.join(process.cwd(), "public")));

const PORT = Number(process.env.PORT || 3000);
const RENDER_SECRET = process.env.RENDER_SECRET || "";
const DEFAULT_CONCURRENCY = Number(process.env.RENDER_CONCURRENCY || 4);
const MAX_CONCURRENCY = 6;
const rootDir = process.cwd();

const FALLBACK_PROJECTS = [
  "EdVenture",
  "Juco",
  "Contro",
  "Contes Publishing",
  "Conrad Works",
  "Conrad Ventures",
  "SRVC",
  "Contes Ventures",
  "Personal"
];

function notionTitleProperty(properties = {}) {
  return Object.entries(properties).find(
    ([, value]) => value?.type === "title"
  );
}

function notionPropertyValue(property) {
  if (!property) return "";

  if (property.type === "title" || property.type === "rich_text") {
    return (property[property.type] || [])
      .map((item) => item?.plain_text || item?.text?.content || "")
      .join("");
  }

  if (property.type === "select") {
    return property.select?.name || "";
  }

  return "";
}

async function getNotionProjects() {
  const token = process.env.NOTION_API_TOKEN;
  const databaseId =
    process.env.NOTION_PROJECTS_DATABASE_ID ||
    "083802c8-0e5d-48a4-809e-bd75af8a1334";

  if (!token) return FALLBACK_PROJECTS;

  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 100
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `Notion projects query failed: ${response.status} ${await response.text()}`
    );
  }

  const payload = await response.json();

  return payload.results
    .map((page) => {
      const titleEntry = notionTitleProperty(page.properties);
      return titleEntry
        ? notionPropertyValue(titleEntry[1])
        : "";
    })
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "video-renderer",
    remotion: "4.0.520"
  });
});

app.get("/editor", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "editor.html"));
});

app.get("/api/projects", async (_req, res) => {
  try {
    const projects = await getNotionProjects();
    res.json({ projects, source: process.env.NOTION_API_TOKEN ? "notion" : "fallback" });
  } catch (error) {
    console.error("Project lookup failed:", error);
    res.json({ projects: FALLBACK_PROJECTS, source: "fallback", warning: error.message });
  }
});

app.get("/api/templates", async (_req, res) => {
  try {
    const templates = await listTemplates();
    res.json({ templates });
  } catch (error) {
    console.error("Template lookup failed:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/templates/:id", async (req, res) => {
  const template = await getTemplate(req.params.id);

  if (!template) {
    return res.status(404).json({ error: "Template not found" });
  }

  res.json(template);
});

app.put("/api/templates/:id", async (req, res) => {
  try {
    const result = await saveTemplate({
      ...req.body,
      id: req.params.id
    });

    res.json(result);
  } catch (error) {
    console.error("Template save failed:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/templates", async (req, res) => {
  try {
    const result = await saveTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Template creation failed:", error);
    res.status(400).json({ error: error.message });
  }
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
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const body = req.body;

    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    let {
      background = "",
      elements = [],
      data = {},
      template = "",
      templateId = "",
      width = 1080,
      height = 1920,
      fps = 30,
      duration = 30,
      compositionId = "",
      outputFormat = "mp4"
    } = body;

    if (!Array.isArray(elements)) {
      return res.status(400).json({ error: "elements must be an array" });
    }

    if (template && typeof template === "object" && !Array.isArray(template)) {
      const resolved = resolveObject(template, data);
      width = resolved.canvas?.width ?? width;
      height = resolved.canvas?.height ?? height;
      fps = resolved.canvas?.fps ?? fps;
      duration = resolved.canvas?.duration ?? duration;
      template = resolved;
      compositionId = "Template";
      elements = Array.isArray(resolved.elements) ? resolved.elements : elements;
      background = resolved.background?.src || resolved.background?.color || background;
      body.templateDefinition = resolved;
    } else if (templateId) {
      const definition = await getTemplate(templateId);

      if (!definition) {
        return res.status(404).json({
          error: `Template "${templateId}" was not found`
        });
      }

      const resolved = resolveObject(definition, data);

      width = resolved.canvas.width;
      height = resolved.canvas.height;
      fps = resolved.canvas.fps;
      duration = resolved.canvas.duration;
      template = resolved;
      compositionId = "Template";
      elements = resolved.elements;
      background =
        resolved.background?.src || resolved.background?.color || "";
      body.templateDefinition = resolved;
    }

    if (template === "EdventurePromo") {
      if (!data || typeof data !== "object" || !data.bgImage) {
        return res.status(400).json({
          error: "data.bgImage is required for EdventurePromo"
        });
      }
    } else if (!templateId && !background && elements.length === 0) {
      return res.status(400).json({
        error: "background or templateId is required"
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
        data,
        template,
        width: numericWidth,
        height: numericHeight,
        fps: numericFps,
        duration: numericDuration,
        templateDefinition: body.templateDefinition || null
      };

      const compositions = await getCompositions(serveUrl, {
        inputProps
      });

      const selectedCompositionId =
        compositionId || (typeof template === "string" ? template : "Template");

      const composition = compositions.find(
        (item) => item.id === selectedCompositionId
      );

      if (!composition) {
        throw new Error(
          `Composition "${selectedCompositionId}" was not found`
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
      res.setHeader(
        "X-Render-Duration-Ms",
        String(Date.now() - startedAt)
      );

      return res.send(await fs.readFile(outputLocation));
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
