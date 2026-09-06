import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import { UserReactLayer } from "./UserReactLayer.jsx";

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easing(value, type = "linear") {
  const t = clamp(value);

  switch (type) {
    case "easeIn":
      return t * t;
    case "easeOut":
      return 1 - (1 - t) * (1 - t);
    case "easeInOut":
      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case "easeOutCubic":
      return 1 - Math.pow(1 - t, 3);
    default:
      return t;
  }
}

function animationProgress(frame, start, duration, easingType = "easeOutCubic") {
  if (frame <= start) return 0;
  if (duration <= 0) return 1;
  return easing((frame - start) / duration, easingType);
}

function getAnimationStyle(element, frame, fps) {
  const start = Math.round(Number(element.start ?? 0) * fps);
  const end = Math.round(
    Number(element.end ?? 999999) * fps
  );
  const animation = element.animation || {};
  const type =
    typeof animation === "string" ? animation : animation.type || "none";
  const duration = Math.max(
    1,
    Math.round(
      Number(
        typeof animation === "object"
          ? animation.duration ?? 0.5
          : 0.5
      ) * fps
    )
  );
  const progress = animationProgress(
    frame,
    start,
    duration,
    animation.easing || "easeOutCubic"
  );

  let x = Number(element.x || 0);
  let y = Number(element.y || 0);
  let scale = Number(element.scale ?? 1);
  let opacity = Number(element.opacity ?? 1);
  let rotation = Number(element.rotation || 0);

  if (type === "fadeIn") {
    opacity *= progress;
  } else if (type === "fadeOut") {
    const fadeStart = Math.max(start, end - duration);
    opacity *= 1 - animationProgress(frame, fadeStart, duration);
  } else if (type === "slideInUp") {
    y += (1 - progress) * Number(animation.distance ?? 80);
    opacity *= progress;
  } else if (type === "slideInDown") {
    y -= (1 - progress) * Number(animation.distance ?? 80);
    opacity *= progress;
  } else if (type === "slideInLeft") {
    x -= (1 - progress) * Number(animation.distance ?? 80);
    opacity *= progress;
  } else if (type === "slideInRight") {
    x += (1 - progress) * Number(animation.distance ?? 80);
    opacity *= progress;
  } else if (type === "scaleIn") {
    scale *= 0.7 + progress * 0.3;
    opacity *= progress;
  } else if (type === "springIn") {
    const springProgress = spring({
      frame: Math.max(0, frame - start),
      fps,
      config: {
        damping: Number(animation.damping ?? 14),
        stiffness: Number(animation.stiffness ?? 100)
      }
    });
    scale *= 0.85 + springProgress * 0.15;
    opacity *= springProgress;
  }

  if (frame < start || frame >= end) {
    opacity = 0;
  }

  return {
    position: "absolute",
    left: x,
    top: y,
    width: element.width,
    height: element.height,
    opacity: clamp(opacity),
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: element.transformOrigin || "center center",
    zIndex: element.zIndex ?? 1,
    boxSizing: "border-box"
  };
}

function TextLayer({ element, frame, fps }) {
  const style = {
    ...getAnimationStyle(element, frame, fps),
    color: element.color || "#ffffff",
    fontSize: Number(element.fontSize || 64),
    fontWeight: element.fontWeight || 400,
    fontFamily: element.fontFamily || "Arial, Helvetica, sans-serif",
    lineHeight: element.lineHeight || 1.1,
    letterSpacing: element.letterSpacing ?? 0,
    textAlign: element.textAlign || "left",
    whiteSpace: element.whiteSpace || "pre-wrap",
    textShadow: element.textShadow || "none",
    background: element.background || "transparent",
    padding: element.padding || 0,
    borderRadius: element.borderRadius || 0,
    display: "flex",
    alignItems: element.alignItems || "flex-start",
    justifyContent: element.justifyContent || "flex-start"
  };

  return <div style={style}>{element.text || ""}</div>;
}

function ImageLayer({ element, frame, fps }) {
  return (
    <Img
      src={element.src}
      style={{
        ...getAnimationStyle(element, frame, fps),
        objectFit: element.objectFit || "cover",
        borderRadius: element.borderRadius || 0
      }}
    />
  );
}

function VideoLayer({ element, frame, fps }) {
  return (
    <OffthreadVideo
      src={element.src}
      muted
      style={{
        ...getAnimationStyle(element, frame, fps),
        objectFit: element.objectFit || "cover"
      }}
    />
  );
}

function ShapeLayer({ element, frame, fps }) {
  return (
    <div
      style={{
        ...getAnimationStyle(element, frame, fps),
        background: element.background || "#ffffff",
        borderRadius:
          element.shape === "circle"
            ? "50%"
            : element.borderRadius || 0,
        border: element.border || "none",
        boxShadow: element.boxShadow || "none"
      }}
    />
  );
}

function ButtonLayer({ element, frame, fps }) {
  return (
    <div
      style={{
        ...getAnimationStyle(element, frame, fps),
        background: element.background || "#ffffff",
        color: element.color || "#000000",
        borderRadius: element.borderRadius ?? 999,
        border: element.border || "none",
        boxShadow: element.boxShadow || "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: element.fontFamily || "Arial, sans-serif",
        fontSize: Number(element.fontSize || 32),
        fontWeight: element.fontWeight || 700,
        textAlign: "center",
        padding: element.padding || 16
      }}
    >
      {element.text || ""}
    </div>
  );
}

export const TemplateComposition = ({
  template = {},
  data = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const background = template.background || {};

  return (
    <AbsoluteFill
      style={{
        backgroundColor: background.color || "#000000",
        overflow: "hidden"
      }}
    >
      {background.src && background.type === "video" ? (
        <OffthreadVideo
          src={background.src}
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: background.objectFit || "cover"
          }}
        />
      ) : background.src ? (
        <Img
          src={background.src}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: background.objectFit || "cover"
          }}
        />
      ) : null}

      {Array.isArray(template.elements)
        ? template.elements.map((rawElement, index) => {
            const element = rawElement;
            const key = element.id || `layer-${index}`;

            if (element.type === "text") {
              return (
                <TextLayer
                  key={key}
                  element={element}
                  frame={frame}
                  fps={fps}
                />
              );
            }

            if (element.type === "image") {
              return (
                <ImageLayer
                  key={key}
                  element={element}
                  frame={frame}
                  fps={fps}
                />
              );
            }

            if (element.type === "video") {
              return (
                <VideoLayer
                  key={key}
                  element={element}
                  frame={frame}
                  fps={fps}
                />
              );
            }

            if (element.type === "shape") {
              return (
                <ShapeLayer
                  key={key}
                  element={element}
                  frame={frame}
                  fps={fps}
                />
              );
            }

            if (element.type === "button") {
              return (
                <ButtonLayer
                  key={key}
                  element={element}
                  frame={frame}
                  fps={fps}
                />
              );
            }

            if (element.type === "react") {
              return (
                <div key={key} style={{ ...getAnimationStyle(element, frame, fps), overflow: "hidden" }}>
                  <UserReactLayer element={element} frame={frame} fps={fps} />
                </div>
              );
            }

            return null;
          })
        : null}
    </AbsoluteFill>
  );
};
