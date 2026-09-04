import React from "react";
import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition.jsx";
import { EdventurePromo } from "./templates/EdventurePromo.jsx";

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
