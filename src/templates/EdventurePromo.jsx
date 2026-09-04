import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const ORANGE = "#F36A21";
const WHITE = "#FFFFFF";

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(t) {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function AnimatedHeadline({ text, startFrame, fps }) {
  const frame = useCurrentFrame();
  const characters = Array.from(text || "");

  const charStep = Math.max(1, Math.round(fps * 0.045));
  const charDuration = Math.max(1, Math.round(fps * 0.18));

  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 90,
        bottom: 455,
        color: WHITE,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 72,
        fontWeight: 800,
        lineHeight: 1.04,
        letterSpacing: -1.5,
        textAlign: "left",
        whiteSpace: "pre-wrap"
      }}
    >
      {characters.map((character, index) => {
        if (character === "\n") {
          return <br key={`br-${index}`} />;
        }

        const charStart = startFrame + index * charStep;
        const progress = easeOutCubic(
          interpolate(
            frame,
            [charStart, charStart + charDuration],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            }
          )
        );

        return (
          <span
            key={`char-${index}`}
            style={{
              display: "inline-block",
              opacity: progress,
              transform: `translateY(${(1 - progress) * 24}px)`,
              whiteSpace: character === " " ? "pre" : "normal"
            }}
          >
            {character}
          </span>
        );
      })}
    </div>
  );
}

function AnimatedButton({ text, startFrame, fps }) {
  const frame = useCurrentFrame();
  const duration = Math.max(1, Math.round(fps * 0.65));

  const progress = easeOutCubic(
    interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    })
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        bottom: 120,
        height: 86,
        borderRadius: 43,
        backgroundColor: WHITE,
        color: ORANGE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: 34,
        fontWeight: 700,
        textAlign: "center",
        opacity: progress,
        transform: `translateY(${(1 - progress) * 90}px)`,
        boxShadow: "0 8px 28px rgba(0,0,0,0.16)"
      }}
    >
      {text}
    </div>
  );
}

export const EdventurePromo = ({
  data = {}
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const {
    bgImage = "",
    headline = "Cambridge nu se pregătește doar pe hârtie.",
    buttonText = "Programează evaluarea gratuită"
  } = data;

  const headlineStart = Math.round(fps * 0.9);
  const headlineCharacters = Array.from(headline || "").length;
  const headlineEnd =
    headlineStart +
    Math.max(1, headlineCharacters) * Math.max(1, Math.round(fps * 0.045)) +
    Math.round(fps * 0.18);

  const buttonStart = headlineEnd + Math.round(fps * 0.2);

  return (
    <AbsoluteFill style={{ backgroundColor: ORANGE, overflow: "hidden" }}>
      {bgImage ? (
        <Img
          src={bgImage}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />
      ) : null}

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(243,106,33,0) 34%, rgba(243,106,33,0.05) 42%, rgba(243,106,33,0.48) 57%, rgba(243,106,33,0.88) 72%, rgba(243,106,33,1) 92%)",
          opacity: easeOutCubic(
            interpolate(
              frame,
              [0, Math.round(fps * 1.25)],
              [0, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
              }
            )
          )
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0) 48%, rgba(0,0,0,0.08) 60%, rgba(0,0,0,0.12) 100%)"
        }}
      />

      <AnimatedHeadline
        text={headline}
        startFrame={headlineStart}
        fps={fps}
      />

      <AnimatedButton
        text={buttonText}
        startFrame={buttonStart}
        fps={fps}
      />
    </AbsoluteFill>
  );
};
