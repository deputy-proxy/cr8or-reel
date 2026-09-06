import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo } from 'remotion';
import Lightfall from './Lightfall.jsx';
import ProceduralBackground from './ProceduralBackground.jsx';
import { getBackgroundDefinition } from './background-registry.js';

export function BackgroundRenderer({ background = {}, width=1080, height=1920, fps=30, time=0, native=false, renderMode='preview' }) {
  const type = background.type || 'solid';
  const props = background.props || {};
  const shell = {position:'absolute',inset:0,width:'100%',height:'100%',overflow:'hidden'};
  if (type === 'solid') return <div style={{...shell,background:props.color||background.color||'#000'}} />;
  if (type === 'image') {
    const src=props.src||background.src;
    return native ? <div style={shell}><img src={src} style={{width:'100%',height:'100%',objectFit:props.objectFit||'cover'}} /></div> : <AbsoluteFill><Img src={src} style={{width:'100%',height:'100%',objectFit:props.objectFit||'cover'}} /></AbsoluteFill>;
  }
  if (type === 'video') {
    const src=props.src||background.src;
    return native ? <div style={shell}><video src={src} muted autoPlay loop playsInline style={{width:'100%',height:'100%',objectFit:props.objectFit||'cover'}} /></div> : <AbsoluteFill><OffthreadVideo src={src} muted style={{width:'100%',height:'100%',objectFit:props.objectFit||'cover'}} /></AbsoluteFill>;
  }
  if (type === 'gradient') return <div style={{...shell,background:`linear-gradient(${Number(props.angle||135)}deg, ${props.color1||'#7c3aed'}, ${props.color2||'#06b6d4'}, ${props.color3||'#ec4899'})`}} />;
  const def=getBackgroundDefinition(type), merged={...(def?.defaults||{}),...props};
  if(type==='lightfall') return <div style={shell}><Lightfall {...merged} width={width} height={height} time={time} dpr={1} safeRender={renderMode==='render'} /></div>;
  return <div style={shell}><ProceduralBackground variant={type} {...merged} width={width} height={height} time={time}/></div>;
}
