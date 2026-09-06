import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import Lightfall from "./Lightfall.jsx";


function resolveTemplate(value, data) {
  if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, data));
  if (!value || typeof value !== "object") {
    if (typeof value !== "string") return value;
    const exact = value.match(/^\{\{\s*([^}]+?)\s*\}\}$/);
    if (exact) {
      const path = exact[1].split(".").map((part) => part.trim());
      let current = data;
      for (const part of path) {
        if (current == null) return value;
        current = current[part];
      }
      return current == null ? value : current;
    }
    return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, path) => {
      let current = data;
      for (const part of path.split(".").map((part) => part.trim())) {
        if (current == null) return _;
        current = current[part];
      }
      return current == null ? _ : String(current);
    });
  }
  const out = {};
  for (const [key, item] of Object.entries(value)) out[key] = resolveTemplate(item, data);
  return out;
}

function clamp(v, min = 0, max = 1) { return Math.min(max, Math.max(min, v)); }
function ease(v, type = "easeOutCubic") {
  const t = clamp(v);
  if (type === "easeIn") return t * t;
  if (type === "easeOut") return 1 - (1 - t) * (1 - t);
  if (type === "easeInOut") return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  return 1 - Math.pow(1 - t, 3);
}
function styleFor(e, frame, fps) {
  const start = Math.round(Number(e.start || 0) * fps);
  const end = Math.round(Number(e.end ?? 9999) * fps);
  const a = typeof e.animation === "string" ? { type: e.animation } : (e.animation || {});
  const duration = Math.max(1, Math.round(Number(a.duration ?? .5) * fps));
  const p = ease((frame - start) / duration, a.easing);
  let x = Number(e.x || 0), y = Number(e.y || 0), scale = Number(e.scale ?? 1), opacity = Number(e.opacity ?? 1);
  if (a.type === "fadeIn") opacity *= p;
  if (a.type === "slideInUp") { y += (1 - p) * Number(a.distance ?? 80); opacity *= p; }
  if (a.type === "slideInDown") { y -= (1 - p) * Number(a.distance ?? 80); opacity *= p; }
  if (a.type === "slideInLeft") { x -= (1 - p) * Number(a.distance ?? 80); opacity *= p; }
  if (a.type === "slideInRight") { x += (1 - p) * Number(a.distance ?? 80); opacity *= p; }
  if (a.type === "scaleIn") { scale *= .7 + .3 * p; opacity *= p; }
  if (a.type === "springIn") {
    const sp = spring({ frame: Math.max(0, frame - start), fps, config: { damping: Number(a.damping ?? 14), stiffness: Number(a.stiffness ?? 100) } });
    scale *= .85 + .15 * sp; opacity *= sp;
  }
  if (frame < start || frame >= end) opacity = 0;
  return { position: "absolute", left: x, top: y, width: e.width, height: e.height, opacity: clamp(opacity), transform: `scale(${scale}) rotate(${Number(e.rotation || 0)}deg)`, transformOrigin: e.transformOrigin || "center center", zIndex: e.zIndex ?? 1, boxSizing: "border-box" };
}

function Layer({ e, frame, fps }) {
  const style = styleFor(e, frame, fps);
  if (e.type === "text" || e.type === "button") return <div style={{ ...style, color: e.color || "#fff", fontSize: Number(e.fontSize || 64), fontWeight: e.fontWeight || 400, fontFamily: e.fontFamily || "Arial, sans-serif", lineHeight: e.lineHeight || 1.1, letterSpacing: e.letterSpacing ?? 0, textAlign: e.textAlign || "left", whiteSpace: "pre-wrap", padding: e.padding || 0, borderRadius: e.borderRadius || 0, background: e.type === "button" ? e.background || "#fff" : e.background || "transparent", display: "flex", alignItems: e.alignItems || "flex-start", justifyContent: e.justifyContent || "flex-start" }}>{e.text || ""}</div>;
  if (e.type === "image") return <Img src={e.src} style={{ ...style, objectFit: e.objectFit || "cover", borderRadius: e.borderRadius || 0 }} />;
  if (e.type === "video") return <OffthreadVideo src={e.src} muted style={{ ...style, objectFit: e.objectFit || "cover" }} />;
  if (e.type === "shape") return <div style={{ ...style, background: e.background || "#fff", border: e.border || "none", borderRadius: e.shape === "circle" ? "50%" : e.borderRadius || 0, boxShadow: e.boxShadow || "none" }} />;
  return null;
}

export const LightfallTemplate = ({ template = {}, data = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const resolvedTemplate = resolveTemplate(template, data);
  const bg = resolvedTemplate.background?.lightfall || resolvedTemplate.lightfall || {};
  const time = frame / fps;

  return (
    <AbsoluteFill style={{ backgroundColor: bg.backgroundColor || "#ffffff", overflow: "hidden" }}>
      <AbsoluteFill style={{ zIndex: 0 }}>
        <Lightfall {...bg} time={time} />
      </AbsoluteFill>
      {resolvedTemplate.background?.src ? <Img src={resolvedTemplate.background.src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: resolvedTemplate.background.objectFit || "cover", zIndex: 1 }} /> : null}
      {(resolvedTemplate.elements || []).map((e, i) => <Layer key={e.id || i} e={e} frame={frame} fps={fps} />)}
    </AbsoluteFill>
  );
};
