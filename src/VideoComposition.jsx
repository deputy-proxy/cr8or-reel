import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring
} from "remotion";

function animatedStyle(element, frame, fps) {
  const start = Math.round((element.start ?? 0) * fps);
  const end = Math.round((element.end ?? 999999) * fps);
  const animation = element.animation || "none";
  const duration = Math.max(1, Math.round((element.animationDuration ?? 0.6) * fps));

  let opacity = element.opacity ?? 1;
  let x = element.x ?? 0;
  let y = element.y ?? 0;
  let scale = element.scale ?? 1;

  if (animation === "fadeIn") {
    opacity *= interpolate(frame, [start, start + duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  }

  if (animation === "fadeOut") {
    opacity *= interpolate(frame, [end - duration, end], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  }

  if (animation === "slideInUp") {
    const p = interpolate(frame, [start, start + duration], [80, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    y += p;
  }

  if (animation === "slideInDown") {
    const p = interpolate(frame, [start, start + duration], [-80, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    y += p;
  }

  if (animation === "slideInLeft") {
    const p = interpolate(frame, [start, start + duration], [-120, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    x += p;
  }

  if (animation === "slideInRight") {
    const p = interpolate(frame, [start, start + duration], [120, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    x += p;
  }

  if (animation === "scaleIn") {
    scale *= interpolate(frame, [start, start + duration], [0.85, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  }

  return {
    position: "absolute",
    left: x,
    top: y,
    width: element.width,
    height: element.height,
    opacity,
    transform: `scale(${scale}) rotate(${element.rotation ?? 0}deg)`,
    transformOrigin: element.transformOrigin || "center center",
    display: frame < start || frame > end ? "none" : "block"
  };
}

function TextElement({ element, frame, fps }) {
  const style = animatedStyle(element, frame, fps);

  return (
    <div
      style={{
        ...style,
        color: element.color || "#ffffff",
        fontFamily: element.fontFamily || "Arial, sans-serif",
        fontSize: element.fontSize || 72,
        fontWeight: element.fontWeight || 700,
        lineHeight: element.lineHeight || 1.05,
        textAlign: element.textAlign || "left",
        whiteSpace: element.whiteSpace || "pre-wrap"
      }}
    >
      {element.text || ""}
    </div>
  );
}

function ImageElement({ element, frame, fps }) {
  const style = animatedStyle(element, frame, fps);

  return (
    <Img
      src={element.src}
      style={{
        ...style,
        objectFit: element.objectFit || "contain"
      }}
    />
  );
}

export const VideoComposition = ({
  background,
  elements = []
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {background ? (
        <OffthreadVideo
          src={background}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      ) : null}

      {elements.map((element, index) => {
        if (element.type === "text") {
          return (
            <TextElement
              key={element.id || index}
              element={element}
              frame={frame}
              fps={fps}
            />
          );
        }

        if (element.type === "image") {
          return (
            <ImageElement
              key={element.id || index}
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