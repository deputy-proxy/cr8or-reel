import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition.jsx";
import { TemplateComposition } from "./TemplateComposition.jsx";
import { EdventurePromo } from "./templates/EdventurePromo.jsx";
import { ChromeCarousel } from "./templates/ChromeCarousel.jsx";

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
        height={2532}
        fps={60}
        durationInFrames={558}
        defaultProps={{
          template: {
            canvas: { width: 1170, height: 2532, fps: 60, duration: 9.3 },
            chromeCarousel: { slideCount: 4, slideDuration: 2.325, transitionDuration: 0.55 },
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
