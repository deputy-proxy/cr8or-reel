import React from "react";
import { userReactComponents } from "./user-components/index.jsx";
import Lightfall from "./user-components/lightfall.jsx";

const builtIns = { lightfall: Lightfall };

function normalizeId(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
}

export function UserReactLayer({ element, frame, fps }) {
  const id = normalizeId(element?.componentId || element?.react?.componentId || element?.componentName);
  const Component = userReactComponents[id] || builtIns[id];
  if (!Component) return <div style={{width:"100%",height:"100%",display:"grid",placeItems:"center",color:"#fff",background:"#181b24",fontFamily:"Arial,sans-serif",fontSize:16}}>React component unavailable: {element?.componentName || id}</div>;
  return <Component {...(element?.reactProps || {})} width={element?.width} height={element?.height} frame={frame} fps={fps} time={frame / fps} />;
}
