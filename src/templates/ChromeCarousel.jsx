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

const transitionEase = Easing.bezier(0.65, 0, 0.35, 1);

function progressFor(frame, start, duration) {
  return clamp((frame - start) / Math.max(1, duration));
}

function SlideArtwork({ slide, width, height }) {
  if (slide.image) {
    return (
      <Img
        src={slide.image}
        style={{
          position: "absolute",
          inset: 0,
          width,
          height,
          objectFit: "cover"
        }}
      />
    );
  }

  return (
    <AbsoluteFill
      style={{
        background: slide.background || "#f5dfe2",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: width * 0.075,
          top: height * 0.27,
          width: width * 0.85,
          height: height * 0.50,
          borderRadius: width * 0.035,
          background: slide.cardColor || "#df2634"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.12,
          top: height * 0.45,
          width: width * 0.76,
          textAlign: "center",
          color: "#fff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: width * 0.065,
          fontWeight: 500
        }}
      >
        {slide.title || "Title"}
      </div>
      <div
        style={{
          position: "absolute",
          left: width * 0.12,
          top: height * 0.62,
          width: width * 0.76,
          textAlign: "center",
          color: "#fff",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: width * 0.06,
          fontWeight: 500
        }}
      >
        {slide.subtitle || "Subtitle"}
      </div>
    </AbsoluteFill>
  );
}

function Slide({ slide, progress, direction, width, height }) {
  const entering = direction === "enter";

  const x = interpolate(
    progress,
    [0, 1],
    entering ? [width, 0] : [0, -width],
    {
      easing: transitionEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    }
  );

  const rotateY = interpolate(
    progress,
    [0, 1],
    entering ? [72, 0] : [0, -72],
    {
      easing: transitionEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    }
  );

  const scale = interpolate(
    progress,
    [0, 0.5, 1],
    entering ? [0.98, 0.99, 1] : [1, 0.99, 0.98],
    {
      easing: transitionEase,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    }
  );

  return (
    <AbsoluteFill
      style={{
        perspective: 1500,
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          transformOrigin: "50% 50%",
          transform: `translate3d(${x}px,0,0) rotateY(${rotateY}deg) scale(${scale})`,
          backfaceVisibility: "hidden"
        }}
      >
        <SlideArtwork slide={slide} width={width} height={height} />
      </div>
    </AbsoluteFill>
  );
}

export function ChromeCarousel({ template = {}, data = {} }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const slides = data.slides?.length
    ? data.slides
    : template.sampleData?.slides?.length
      ? template.sampleData.slides
      : [];

  const slideCount = Math.max(
    1,
    Number(template.chromeCarousel?.slideCount || slides.length || 4)
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
    ? progressFor(frame, slideStart + transitionStart, transitionFrames)
    : 1;

  const currentSlide = slides[currentIndex] || {};
  const nextSlide = slides[currentIndex + 1] || {};

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: currentSlide.background || "#f5dfe2",
        perspective: 1500
      }}
    >
      <Slide
        slide={currentSlide}
        progress={progress}
        direction="leave"
        width={width}
        height={height}
      />

      {transitioning && (
        <Slide
          slide={nextSlide}
          progress={progress}
          direction="enter"
          width={width}
          height={height}
        />
      )}
    </AbsoluteFill>
  );
}
