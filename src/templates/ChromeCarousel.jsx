import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  Easing,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const ease = Easing.bezier(0.22, 1, 0.36, 1);

function transitionProgress(frame, start, duration) {
  return clamp((frame - start) / Math.max(1, duration));
}

function renderableElements(template = {}, slideIndex) {
  return (template.elements || [])
    .filter((element) => Number(element.slide ?? -1) === slideIndex)
    .slice()
    .sort((a, b) => Number(a.zIndex || 0) - Number(b.zIndex || 0));
}

function layerStyle(element, width, height) {
  return {
    position: "absolute",
    left: Number(element.x || 0),
    top: Number(element.y || 0),
    width: Number(element.width || 0),
    height: Number(element.height || 0),
    opacity: Number(element.opacity ?? 1),
    zIndex: Number(element.zIndex || 1),
    boxSizing: "border-box",
    transform: `rotate(${Number(element.rotation || 0)}deg) scale(${Number(element.scale ?? 1)})`,
    transformOrigin: element.transformOrigin || "center center"
  };
}

function Layer({ element, width, height }) {
  const style = layerStyle(element, width, height);

  if (element.type === "image") {
    if (!element.src) {
      return (
        <div
          style={{
            ...style,
            border: "2px dashed rgba(255,255,255,.35)",
            borderRadius: Number(element.borderRadius || 0),
            background: "rgba(255,255,255,.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,.65)",
            fontFamily: "Arial, sans-serif",
            fontSize: 22
          }}
        >
          {element.placeholder || "IMAGE"}
        </div>
      );
    }

    return (
      <Img
        src={element.src}
        style={{
          ...style,
          objectFit: element.objectFit || "cover",
          borderRadius: Number(element.borderRadius || 0)
        }}
      />
    );
  }

  if (element.type === "text" || element.type === "button") {
    return (
      <div
        style={{
          ...style,
          background: element.background || "transparent",
          color: element.color || "#fff",
          borderRadius: Number(element.borderRadius || 0),
          border: element.border || "none",
          boxShadow: element.boxShadow || "none",
          fontFamily: element.fontFamily || "Arial, Helvetica, sans-serif",
          fontSize: Number(element.fontSize || 48),
          fontWeight: Number(element.fontWeight || 400),
          lineHeight: element.lineHeight || 1.1,
          letterSpacing: Number(element.letterSpacing || 0),
          textAlign: element.textAlign || "left",
          whiteSpace: element.whiteSpace || "pre-wrap",
          display: "flex",
          alignItems: element.alignItems || "flex-start",
          justifyContent: element.justifyContent || "flex-start",
          padding: Number(element.padding || 0),
          overflow: "hidden"
        }}
      >
        {element.text || ""}
      </div>
    );
  }

  if (element.type === "shape") {
    return (
      <div
        style={{
          ...style,
          background: element.background || "#fff",
          borderRadius:
            element.shape === "circle"
              ? "50%"
              : Number(element.borderRadius || 0),
          border: element.border || "none",
          boxShadow: element.boxShadow || "none"
        }}
      />
    );
  }

  return null;
}

function Slide({ elements, progress, direction, width, height }) {
  const entering = direction === "enter";

  const x = interpolate(
    progress,
    [0, 1],
    entering ? [width * 1.02, 0] : [0, -width * 1.02],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rotateY = interpolate(
    progress,
    [0, 1],
    entering ? [68, 0] : [0, -68],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(
    progress,
    [0, 1],
    entering ? [0.96, 1] : [1, 0.96],
    { easing: ease, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = interpolate(
    Math.abs(rotateY),
    [0, 45, 68],
    [1, 1, 0.2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        perspective: 1800,
        transformStyle: "preserve-3d",
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width,
          height,
          transform: `translateX(${x}px) rotateY(${rotateY}deg) scale(${scale})`,
          transformOrigin: "50% 50%",
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
          opacity
        }}
      >
        {elements.map((element) => (
          <Layer
            key={element.id}
            element={element}
            width={width}
            height={height}
          />
        ))}
      </div>
    </div>
  );
}

export function ChromeCarousel({ template = {}, data = {} }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const slideCount = Math.max(
    1,
    Number(template.chromeCarousel?.slideCount || data.slides?.length || 4)
  );

  const slideDuration = Number(
    template.chromeCarousel?.slideDuration || data.slideDuration || 2.325
  );

  const transitionDuration = Number(
    template.chromeCarousel?.transitionDuration || data.transitionDuration || 0.55
  );

  const slideFrames = slideDuration * fps;
  const transitionFrames = transitionDuration * fps;
  const totalFrames = slideCount * slideFrames;
  const localFrame = Math.min(frame, Math.max(0, totalFrames - 1));

  const currentIndex = Math.min(
    slideCount - 1,
    Math.floor(localFrame / slideFrames)
  );

  const slideStart = currentIndex * slideFrames;
  const elapsed = localFrame - slideStart;
  const transitionStart = slideFrames - transitionFrames;
  const transitioning =
    currentIndex < slideCount - 1 && elapsed >= transitionStart;

  const progress = transitioning
    ? transitionProgress(frame, slideStart + transitionStart, transitionFrames)
    : 1;

  const currentElements = renderableElements(template, currentIndex);
  const nextElements = transitioning
    ? renderableElements(template, currentIndex + 1)
    : [];

  const currentBackground =
    currentElements.find((element) => element.role === "background")?.background ||
    template.background?.color ||
    "#f5f5f5";

  return (
    <AbsoluteFill
      style={{
        backgroundColor: currentBackground,
        overflow: "hidden",
        perspective: 1800
      }}
    >
      <Slide
        elements={currentElements}
        progress={progress}
        direction="leave"
        width={width}
        height={height}
      />

      {transitioning && (
        <Slide
          elements={nextElements}
          progress={progress}
          direction="enter"
          width={width}
          height={height}
        />
      )}
    </AbsoluteFill>
  );
}
