const state = {
  projects: [],
  templates: [],
  template: null,
  selectedLayerId: null
};

const $ = (id) => document.getElementById(id);

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

function uid(prefix = "layer") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function projectOptions(selected = "") {
  return state.projects
    .map((project) =>
      `<option value="${escapeHtml(project)}" ${project === selected ? "selected" : ""}>${escapeHtml(project)}</option>`
    )
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function currentLayer() {
  return state.template?.elements?.find(
    (element) => element.id === state.selectedLayerId
  ) || null;
}

function setTemplateDefaults(template) {
  return {
    version: 1,
    id: template?.id || "",
    name: template?.name || "New template",
    project: template?.project || state.projects[0] || "",
    format: template?.format || "reel",
    canvas: {
      width: Number(template?.canvas?.width || 1080),
      height: Number(template?.canvas?.height || 1920),
      fps: Number(template?.canvas?.fps || 30),
      duration: Number(template?.canvas?.duration || 8)
    },
    sampleData: template?.sampleData || {},
    background: template?.background || { color: "#111111" },
    elements: Array.isArray(template?.elements)
      ? template.elements
      : []
  };
}

function renderProjectSelect() {
  $("projectSelect").innerHTML = projectOptions(state.template?.project);
  $("templateProject").innerHTML = projectOptions(state.template?.project);

  $("projectSelect").value = state.template?.project || "";
  $("templateProject").value = state.template?.project || "";
}

function renderTemplateList() {
  const selectedProject = $("projectSelect").value;

  const visible = state.templates.filter(
    (template) => !selectedProject || template.project === selectedProject
  );

  $("templateList").innerHTML = visible.length
    ? visible.map((template) => `
        <button class="template-card ${template.id === state.template?.id ? "active" : ""}" data-id="${escapeHtml(template.id)}">
          ${escapeHtml(template.name)}
          <small>${escapeHtml(template.format || "reel")}</small>
        </button>
      `).join("")
    : `<div class="empty">No templates for this project.</div>`;

  document.querySelectorAll(".template-card").forEach((button) => {
    button.addEventListener("click", () => loadTemplate(button.dataset.id));
  });
}

function renderCanvas() {
  const canvas = $("canvas");
  const template = state.template;

  if (!template) return;

  const width = Number(template.canvas.width);
  const height = Number(template.canvas.height);

  canvas.style.aspectRatio = `${width} / ${height}`;
  canvas.style.background = template.background?.color || "#000";

  if (template.background?.src) {
    canvas.style.backgroundImage = `url("${template.background.src}")`;
    canvas.style.backgroundSize = template.background.objectFit || "cover";
    canvas.style.backgroundPosition = "center";
  } else {
    canvas.style.backgroundImage = "none";
  }

  canvas.innerHTML = "";

  [...template.elements]
    .sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0))
    .forEach((element) => {
      const node = document.createElement("div");
      node.className = `layer ${element.id === state.selectedLayerId ? "selected" : ""}`;
      node.dataset.id = element.id;

      const scale = canvas.clientWidth / width;

      node.style.left = `${Number(element.x || 0) * scale}px`;
      node.style.top = `${Number(element.y || 0) * scale}px`;
      node.style.width = `${Number(element.width || 200) * scale}px`;
      node.style.height = `${Number(element.height || 100) * scale}px`;
      node.style.opacity = Number(element.opacity ?? 1);
      node.style.transform = `rotate(${Number(element.rotation || 0)}deg)`;
      node.style.zIndex = Number(element.zIndex || 1);
      node.style.borderRadius = `${Number(element.borderRadius || 0) * scale}px`;
      node.style.background = element.background || "transparent";

      if (element.type === "text" || element.type === "button") {
        node.textContent = element.text || "Text";
        node.style.color = element.color || "#fff";
        node.style.fontFamily = element.fontFamily || "Arial, sans-serif";
        node.style.fontSize = `${Number(element.fontSize || 48) * scale}px`;
        node.style.fontWeight = element.fontWeight || 400;
        node.style.lineHeight = element.lineHeight || 1.1;
        node.style.padding = `${Number(element.padding || 0) * scale}px`;
        node.style.display = "flex";
        node.style.alignItems = element.alignItems || "flex-start";
        node.style.justifyContent = element.justifyContent || "flex-start";
        node.style.textAlign = element.textAlign || "left";
        node.style.whiteSpace = "pre-wrap";
      } else if (element.type === "image" || element.type === "video") {
        if (element.src) {
          node.style.backgroundImage = `url("${element.src}")`;
          node.style.backgroundSize = element.objectFit || "cover";
          node.style.backgroundPosition = "center";
        }
      } else if (element.type === "shape") {
        node.style.background = element.background || "#fff";
        node.style.border = element.border || "none";
        if (element.shape === "circle") node.style.borderRadius = "50%";
      }

      const handle = document.createElement("div");
      handle.className = "resize-handle";
      node.appendChild(handle);

      node.addEventListener("mousedown", startDrag);
      handle.addEventListener("mousedown", startResize);
      canvas.appendChild(node);
    });
}

function renderTimeline() {
  $("timelineLayers").innerHTML = (state.template?.elements || [])
    .slice()
    .reverse()
    .map((element) => `
      <button class="timeline-layer ${element.id === state.selectedLayerId ? "active" : ""}" data-id="${escapeHtml(element.id)}">
        ${escapeHtml(element.name || element.text || element.type)}
      </button>
    `).join("");

  document.querySelectorAll(".timeline-layer").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLayerId = button.dataset.id;
      render();
    });
  });
}

function renderInspector() {
  const template = state.template;
  const layer = currentLayer();

  $("templateName").textContent = template?.name || "Template";
  $("nameInput").value = template?.name || "";
  $("templateProject").value = template?.project || "";

  $("widthInput").value = template?.canvas?.width || 1080;
  $("heightInput").value = template?.canvas?.height || 1920;
  $("fpsInput").value = template?.canvas?.fps || 30;
  $("durationInput").value = template?.canvas?.duration || 8;

  $("emptyInspector").hidden = !!layer;
  $("layerInspector").hidden = !layer;

  if (!layer) return;

  $("layerType").value = layer.type;
  $("layerText").value = layer.text || layer.src || "";
  $("layerX").value = layer.x || 0;
  $("layerY").value = layer.y || 0;
  $("layerWidth").value = layer.width || 200;
  $("layerHeight").value = layer.height || 100;
  $("layerStart").value = layer.start || 0;
  $("layerEnd").value = layer.end ?? template.canvas.duration;
  $("layerOpacity").value = layer.opacity ?? 1;
  $("layerRotation").value = layer.rotation || 0;
  $("fontSize").value = layer.fontSize || 48;
  $("fontWeight").value = layer.fontWeight || 400;
  $("layerColor").value = layer.color || "#ffffff";
  $("layerBackground").value = layer.background || "transparent";
  $("imageSrc").value = layer.src || "";
  $("objectFit").value = layer.objectFit || "cover";
  $("shapeBackground").value = layer.background || "#ffffff";
  $("borderRadius").value = layer.borderRadius || 0;

  const animation =
    typeof layer.animation === "string"
      ? layer.animation
      : layer.animation?.type || "none";

  $("animationType").value = animation;

  $("textFields").hidden = !["text", "button"].includes(layer.type);
  $("imageFields").hidden = !["image", "video"].includes(layer.type);
  $("shapeFields").hidden = layer.type !== "shape";
}

function render() {
  renderProjectSelect();
  renderTemplateList();
  renderCanvas();
  renderTimeline();
  renderInspector();
}

async function loadTemplate(id) {
  state.template = setTemplateDefaults(await api(`/api/templates/${encodeURIComponent(id)}`));
  state.selectedLayerId = null;
  render();
}

function updateTemplateField(id, value) {
  if (!state.template) return;
  state.template[id] = value;
  renderInspector();
}

function updateLayerField(field, value) {
  const layer = currentLayer();
  if (!layer) return;

  layer[field] = value;
  renderCanvas();
  renderTimeline();
}

function addLayer(type) {
  const template = state.template;
  if (!template) return;

  const common = {
    id: uid(type),
    name: `${type} layer`,
    x: 120,
    y: 240,
    width: type === "text" ? 840 : 600,
    height: type === "text" ? 180 : 400,
    zIndex: template.elements.length + 1,
    opacity: 1,
    start: 0,
    end: template.canvas.duration,
    rotation: 0,
    animation: {
      type: "fadeIn",
      duration: 0.5,
      easing: "easeOutCubic"
    }
  };

  let layer = { ...common, type };

  if (type === "text") {
    layer = {
      ...layer,
      name: "Text",
      text: "{{product.name}}",
      color: "#ffffff",
      fontSize: 72,
      fontWeight: 800,
      fontFamily: "Arial, sans-serif",
      lineHeight: 1.05,
      background: "transparent",
      padding: 0
    };
  }

  if (type === "image") {
    layer = {
      ...layer,
      name: "Image",
      src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
      objectFit: "cover"
    };
  }

  if (type === "shape") {
    layer = {
      ...layer,
      name: "Shape",
      width: 500,
      height: 120,
      background: "#ffffff",
      borderRadius: 20
    };
  }

  template.elements.push(layer);
  state.selectedLayerId = layer.id;
  render();
}

async function save() {
  if (!state.template) return;

  const saved = await api(`/api/templates/${encodeURIComponent(state.template.id)}`, {
    method: "PUT",
    body: JSON.stringify(state.template)
  });

  state.template = setTemplateDefaults(saved);
  state.templates = state.templates.map((template) =>
    template.id === saved.id ? saved : template
  );

  render();
  alert("Template saved.");
}

async function renderMp4() {
  if (!state.template) return;

  const response = await fetch("/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      templateId: state.template.id,
      data: state.template.sampleData || {}
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    alert(error.error || "Render failed.");
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${state.template.id}.mp4`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function startDrag(event) {
  if (event.target.classList.contains("resize-handle")) return;

  const layer = state.template.elements.find(
    (item) => item.id === event.currentTarget.dataset.id
  );

  if (!layer) return;

  state.selectedLayerId = layer.id;
  renderInspector();

  const canvas = $("canvas");
  const scale = canvas.clientWidth / state.template.canvas.width;
  const startX = event.clientX;
  const startY = event.clientY;
  const originalX = Number(layer.x || 0);
  const originalY = Number(layer.y || 0);

  function move(moveEvent) {
    layer.x = Math.round(originalX + (moveEvent.clientX - startX) / scale);
    layer.y = Math.round(originalY + (moveEvent.clientY - startY) / scale);
    renderCanvas();
    renderInspector();
  }

  function stop() {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", stop);
  }

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);
}

function startResize(event) {
  event.stopPropagation();

  const layer = currentLayer();
  if (!layer) return;

  const canvas = $("canvas");
  const scale = canvas.clientWidth / state.template.canvas.width;
  const startX = event.clientX;
  const startY = event.clientY;
  const originalWidth = Number(layer.width || 200);
  const originalHeight = Number(layer.height || 100);

  function move(moveEvent) {
    layer.width = Math.max(
      20,
      Math.round(originalWidth + (moveEvent.clientX - startX) / scale)
    );
    layer.height = Math.max(
      20,
      Math.round(originalHeight + (moveEvent.clientY - startY) / scale)
    );
    renderCanvas();
    renderInspector();
  }

  function stop() {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", stop);
  }

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", stop);
}

function bindInputs() {
  $("projectSelect").addEventListener("change", () => {
    const project = $("projectSelect").value;
    state.template.project = project;
    render();
  });

  $("templateProject").addEventListener("change", () => {
    state.template.project = $("templateProject").value;
    renderTemplateList();
  });

  $("nameInput").addEventListener("input", (event) => {
    state.template.name = event.target.value;
    $("templateName").textContent = event.target.value;
  });

  for (const [id, field] of [
    ["widthInput", "width"],
    ["heightInput", "height"],
    ["fpsInput", "fps"],
    ["durationInput", "duration"]
  ]) {
    $(id).addEventListener("input", (event) => {
      state.template.canvas[field] = Number(event.target.value);
      renderCanvas();
      renderInspector();
    });
  }

  for (const [id, field] of [
    ["layerX", "x"],
    ["layerY", "y"],
    ["layerWidth", "width"],
    ["layerHeight", "height"],
    ["layerStart", "start"],
    ["layerEnd", "end"],
    ["layerOpacity", "opacity"],
    ["layerRotation", "rotation"],
    ["fontSize", "fontSize"],
    ["fontWeight", "fontWeight"],
    ["layerColor", "color"],
    ["layerBackground", "background"],
    ["imageSrc", "src"],
    ["objectFit", "objectFit"],
    ["shapeBackground", "background"],
    ["borderRadius", "borderRadius"]
  ]) {
    $(id).addEventListener("input", (event) => {
      updateLayerField(
        field,
        ["color", "background", "src", "objectFit"].includes(field)
          ? event.target.value
          : Number(event.target.value)
      );
      renderInspector();
    });
  }

  $("layerText").addEventListener("input", (event) => {
    const layer = currentLayer();
    if (!layer) return;
    if (["image", "video"].includes(layer.type)) {
      layer.src = event.target.value;
    } else {
      layer.text = event.target.value;
    }
    renderCanvas();
  });

  $("animationType").addEventListener("change", (event) => {
    const layer = currentLayer();
    if (!layer) return;

    layer.animation =
      event.target.value === "none"
        ? { type: "none" }
        : {
            type: event.target.value,
            duration: 0.5,
            easing: "easeOutCubic"
          };

    renderCanvas();
  });

  $("deleteLayer").addEventListener("click", () => {
    if (!state.template || !state.selectedLayerId) return;

    state.template.elements = state.template.elements.filter(
      (element) => element.id !== state.selectedLayerId
    );

    state.selectedLayerId = null;
    render();
  });

  $("addText").addEventListener("click", () => addLayer("text"));
  $("addImage").addEventListener("click", () => addLayer("image"));
  $("addShape").addEventListener("click", () => addLayer("shape"));
  $("saveTemplate").addEventListener("click", save);
  $("renderTemplate").addEventListener("click", renderMp4);

  $("newTemplate").addEventListener("click", async () => {
    const template = setTemplateDefaults({
      id: `template-${Date.now()}`,
      name: "New template",
      project: state.projects[0] || "",
      elements: []
    });

    state.template = template;
    state.selectedLayerId = null;

    await api("/api/templates", {
      method: "POST",
      body: JSON.stringify(template)
    });

    state.templates = await api("/api/templates").then((data) => data.templates);
    render();
  });
}

async function init() {
  bindInputs();

  const projects = await api("/api/projects");
  state.projects = projects.projects || [];

  const templates = await api("/api/templates");
  state.templates = templates.templates || [];

  if (state.templates.length) {
    await loadTemplate(state.templates[0].id);
  } else {
    state.template = setTemplateDefaults({
      id: "starter-template",
      name: "Starter template",
      project: state.projects[0] || ""
    });
    await api("/api/templates", {
      method: "POST",
      body: JSON.stringify(state.template)
    });
    state.templates = await api("/api/templates").then((data) => data.templates);
    render();
  }
}

init().catch((error) => {
  console.error(error);
  alert(error.message);
});
