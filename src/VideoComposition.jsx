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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function animatedStyle(element, frame, fps) {
  const start = Math.round((element.start ?? 0) * fps);
  const end = Math.round((element.end ?? 999999) * fps);
  const animation = element.animation || "none";

  const localFrame = frame - start;
  const durationFrames = Math.max(1, end - start);

  let opacity = element.opacity ?? 1;
  let x = element.x ?? 0;
  let y = element.y ?? 0;
  let scale = element.scale ?? 1;
  let rotation = element.rotation ?? 0;

  const fadeFrames = Math.max(
    1,
    Math.min(Math.round(fps * 0.5), durationFrames)
  );

  if (animation === "fadeIn") {
    opacity *= interpolate(localFrame, [0, fadeFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  }

  if (animation === "fadeOut") {
    const remaining = end - frame;
    opacity *= interpolate(remaining, [0, fadeFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  }

  if (animation === "slideInUp") {
    const progress = interpolate(localFrame, [0, fadeFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    y += interpolate(progress, [0, 1], [80, 0]);
    opacity *= progress;
  }

  if (animation === "slideInDown") {
    const progress = interpolate(localFrame, [0, fadeFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    y -= interpolate(progress, [0, 1], [80, 0]);
    opacity *= progress;
  }

  if (animation === "slideInLeft") {
    const progress = interpolate(localFrame, [0, fadeFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    x -= interpolate(progress, [0, 1], [80, 0]);
    opacity *= progress;
  }

  if (animation === "slideInRight") {
    const progress = interpolate(localFrame, [0, fadeFrames], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    x += interpolate(progress, [0, 1], [80, 0]);
    opacity *= progress;
  }

  if (animation === "scaleIn") {
    const progress = spring({
      frame: Math.max(0, localFrame),
      fps,
      config: { damping: 200 }
    });
    scale *= interpolate(progress, [0, 1], [0.7, 1]);
    opacity *= progress;
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
    opacity: clamp(opacity, 0, 1),
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    transformOrigin: element.transformOrigin || "center center",
    zIndex: element.zIndex ?? 1,
    pointerEvents: "none"
  };
}

function TextElement({ element, frame, fps }) {
  const style = {
    ...animatedStyle(element, frame, fps),
    color: element.color || "#ffffff",
    fontSize: element.fontSize || 64,
    fontWeight: element.fontWeight || 400,
    fontFamily: element.fontFamily || "Arial, sans-serif",
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
    justifyContent: element.justifyContent || "flex-start",
    boxSizing: "border-box"
  };

  return <div style={style}>{element.text || ""}</div>;
}

function ImageElement({ element, frame, fps }) {
  return (
    <Img
      src={element.src}
      style={{
        ...animatedStyle(element, frame, fps),
        objectFit: element.objectFit || "cover"
      }}
    />
  );
}

export const VideoComposition = ({ background, elements = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {background ? (
        <OffthreadVideo
          src={background}
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      ) : null}

      {elements.map((element, index) => {
        const key = element.id || `element-${index}`;

        if (element.type === "text") {
          return (
            <TextElement
              key={key}
              element={element}
              frame={frame}
              fps={fps}
            />
          );
        }

        if (element.type === "image") {
          return (
            <ImageElement
              key={key}
              element={element}
              frame={frame}
              fps={fps}
            />
          );
        }

        return null;
      })}
    </AbsoluteFill>
  );
};
