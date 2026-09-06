import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition.jsx";
import { TemplateComposition } from "./TemplateComposition.jsx";
import { EdventurePromo } from "./templates/EdventurePromo.jsx";
import { ChromeCarousel } from "./templates/ChromeCarousel.jsx";
import { LightfallTemplate } from "./templates/LightfallTemplate.jsx";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Video"
        component={VideoComposition}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={900}
        defaultProps={{
          background: "",
          elements: [],
          width: 1080,
          height: 1920,
          fps: 30,
          duration: 30
        }}
      />

      <Composition
        id="Template"
        component={TemplateComposition}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={240}
        defaultProps={{
          template: {
            canvas: {
              width: 1080,
              height: 1920,
              fps: 30,
              duration: 8
            },
            background: {
              color: "#000000"
            },
            elements: []
          },
          data: {}
        }}
      />

      <Composition
        id="ChromeCarousel"
        component={ChromeCarousel}
        width={1170}
        height={1316}
        fps={60}
        durationInFrames={558}
        defaultProps={{
          template: {
            canvas: { width: 1170, height: 1316, fps: 60, duration: 9.3 },
            chromeCarousel: { slideCount: 4, slideDuration: 2.325, transitionDuration: 0.55 },
            elements: []
          },
          data: {}
        }}
      />


      <Composition
        id="LightfallTemplate"
        component={LightfallTemplate}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={240}
        defaultProps={{
          template: {
            canvas: { width: 1080, height: 1920, fps: 30, duration: 8 },
            background: { lightfall: { color1: "#1d4ed8", color2: "#F97316", color3: "#EF4444", backgroundColor: "#ffffff", speed: 0.5, streakCount: 4, streakWidth: 1.15, streakLength: 1, glow: 1.15, density: 0.6, twinkle: 1, zoom: 3, backgroundGlow: 0, opacity: 1, mouseInteraction: false, mouseStrength: 0.5, mouseRadius: 1, lightMode: true } },
            elements: []
          },
          data: {}
        }}
      />

      <Composition
        id="EdventurePromo"
        component={EdventurePromo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={240}
        defaultProps={{
          data: {
            bgImage: "",
            headline: "Cambridge nu se pregătește doar pe hârtie.",
            buttonText: "Programează evaluarea gratuită"
          }
        }}
      />
    </>
  );
};
