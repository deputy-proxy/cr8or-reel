import fs from "fs/promises";
import path from "path";

const TEMPLATE_DIR = path.join(process.cwd(), "data", "templates");

const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || "deputy-proxy";
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || "cr8or-reel";
const GITHUB_BRANCH = process.env.GITHUB_REPO_BRANCH || "main";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GITHUB_TEMPLATE_DIR =
  process.env.GITHUB_TEMPLATE_DIR || "data/templates";

function githubEnabled() {
  return Boolean(GITHUB_TOKEN);
}

function githubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json"
  };
}

function githubUrl(filePath = "") {
  const encoded = filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/");

  return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encoded}`;
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...githubHeaders(),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API ${response.status}: ${body || response.statusText}`
    );
  }

  return response;
}

async function githubListTemplates() {
  const response = await githubRequest(
    `${githubUrl(GITHUB_TEMPLATE_DIR)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
  );

  const entries = await response.json();

  if (!Array.isArray(entries)) {
    throw new Error("GitHub template directory did not return a file list");
  }

  const templates = [];

  for (const entry of entries.filter(
    (item) => item.type === "file" && item.name.endsWith(".json")
  )) {
    const response = await githubRequest(
      `${githubUrl(entry.path)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );
    const payload = await response.json();

    if (!payload.content) continue;

    const raw = Buffer.from(
      payload.content.replace(/\n/g, ""),
      "base64"
    ).toString("utf8");

    try {
      const template = JSON.parse(raw);
      templates.push({
        ...template,
        id: template.id || entry.name.replace(/\.json$/, "")
      });
    } catch (error) {
      console.warn(`Skipping invalid GitHub template ${entry.path}:`, error.message);
    }
  }

  return templates.sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
}

async function githubGetTemplate(id) {
  const safeId = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return null;

  try {
    const response = await githubRequest(
      `${githubUrl(`${GITHUB_TEMPLATE_DIR}/${safeId}.json`)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );
    const payload = await response.json();

    if (!payload.content) return null;

    const raw = Buffer.from(
      payload.content.replace(/\n/g, ""),
      "base64"
    ).toString("utf8");

    return {
      ...JSON.parse(raw),
      id: safeId
    };
  } catch (error) {
    if (error.message.startsWith("GitHub API 404")) return null;
    throw error;
  }
}

async function githubSaveTemplate(template) {
  const filePath = `${GITHUB_TEMPLATE_DIR}/${template.id}.json`;
  let sha = null;

  try {
    const response = await githubRequest(
      `${githubUrl(filePath)}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );
    const payload = await response.json();
    sha = payload.sha;
  } catch (error) {
    if (!error.message.startsWith("GitHub API 404")) {
      throw error;
    }
  }

  const response = await githubRequest(githubUrl(filePath), {
    method: "PUT",
    body: JSON.stringify({
      message: `Update template: ${template.name}`,
      content: Buffer.from(
        `${JSON.stringify(template, null, 2)}\n`,
        "utf8"
      ).toString("base64"),
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {})
    })
  });

  const payload = await response.json();

  return {
    template,
    commit: {
      sha: payload.commit?.sha || null,
      url: payload.commit?.html_url || null
    }
  };
}

export async function ensureTemplateStore() {
  await fs.mkdir(TEMPLATE_DIR, { recursive: true });
}

export async function listTemplates() {
  if (githubEnabled()) {
    return githubListTemplates();
  }

  await ensureTemplateStore();
  const files = (await fs.readdir(TEMPLATE_DIR))
    .filter((file) => file.endsWith(".json"));

  const templates = [];

  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(TEMPLATE_DIR, file), "utf8");
      const template = JSON.parse(raw);
      templates.push({
        ...template,
        id: template.id || file.replace(/\.json$/, "")
      });
    } catch (error) {
      console.warn(`Skipping invalid template ${file}:`, error.message);
    }
  }

  return templates.sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
}

export async function getTemplate(id) {
  if (githubEnabled()) {
    const githubTemplate = await githubGetTemplate(id);
    if (githubTemplate) return githubTemplate;
    // Keep bundled templates available when GitHub has not received a
    // newly-added template yet, or when a local development token points at
    // a branch that does not contain the template.
  }

  await ensureTemplateStore();
  const safeId = String(id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) return null;

  try {
    const raw = await fs.readFile(
      path.join(TEMPLATE_DIR, `${safeId}.json`),
      "utf8"
    );
    return { ...JSON.parse(raw), id: safeId };
  } catch {
    return null;
  }
}

export async function saveTemplate(template) {
  const id = String(template.id || template.name || "template")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  if (!id) throw new Error("Template id is required");

  const normalized = {
    version: 1,
    id,
    name: template.name || id,
    project: template.project || "",
    format: template.format || "reel",
    canvas: {
      width: Number(template.canvas?.width || 1080),
      height: Number(template.canvas?.height || 1920),
      fps: Number(template.canvas?.fps || 30),
      duration: Number(template.canvas?.duration || 8)
    },
    sampleData: template.sampleData || {},
    background: template.background || null,
    renderer: template.renderer || "",
    chromeCarousel: template.chromeCarousel || null,
    elements: Array.isArray(template.elements) ? template.elements : []
  };

  if (githubEnabled()) {
    return githubSaveTemplate(normalized);
  }

  await ensureTemplateStore();

  await fs.writeFile(
    path.join(TEMPLATE_DIR, `${id}.json`),
    `${JSON.stringify(normalized, null, 2)}\n`,
    "utf8"
  );

  return {
    template: normalized,
    commit: null
  };
}

export function resolveTemplateValue(value, data = {}) {
  if (typeof value !== "string") return value;

  return value.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => {
    const result = key
      .split(".")
      .reduce((current, part) => current?.[part], data);

    return result == null ? "" : String(result);
  });
}

export function resolveObject(value, data = {}) {
  if (Array.isArray(value)) {
    return value.map((item) => resolveObject(item, data));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        resolveObject(child, data)
      ])
    );
  }

  return resolveTemplateValue(value, data);
}
