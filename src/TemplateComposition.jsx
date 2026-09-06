import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundRenderer } from './backgrounds/BackgroundRenderer.jsx';
import { animationStyle } from './animations/animation-registry.js';

export function resolveTemplateValue(value, data = {}) {
  if (typeof value === 'string') return value.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key) => {
    let current = data;
    for (const part of key.split('.')) current = current?.[part];
    return current == null ? '' : String(current);
  });
  if (Array.isArray(value)) return value.map(v => resolveTemplateValue(v,data));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,resolveTemplateValue(v,data)]));
  return value;
}

function styleFor(element, frame, fps, customAnimations) {
  const a = animationStyle(element, frame, fps, customAnimations);
  const padding = Number(element.padding || 0);
  const blur = Number(element.backdropBlur || 0);
  return {
    position:'absolute', left:a.x, top:a.y, width:element.width, height:element.height,
    opacity:Math.max(0,Math.min(1,a.opacity)), transform:`scale(${a.scale}) rotate(${a.rotation}deg)`,
    transformOrigin:element.transformOrigin||'center center', filter:a.filter||'none', clipPath:a.clipPath||'none',
    zIndex:element.zIndex??1, boxSizing:'border-box', overflow:element.overflow||'hidden',
    padding, boxShadow:element.boxShadow||'none', border:element.border||'none',
    borderRadius:element.shape==='circle'?'50%':element.borderRadius||0,
    backdropFilter:blur>0?`blur(${blur}px)`:'none', WebkitBackdropFilter:blur>0?`blur(${blur}px)`:'none',
    mixBlendMode:element.blendMode||'normal'
  };
}
function TextLayer({element,frame,fps,customAnimations}) { return <div style={{...styleFor(element,frame,fps,customAnimations),color:element.color||'#fff',fontSize:Number(element.fontSize||64),fontWeight:element.fontWeight||400,fontFamily:element.fontFamily||'Arial,Helvetica,sans-serif',lineHeight:element.lineHeight||1.1,letterSpacing:element.letterSpacing??0,textAlign:element.textAlign||'left',whiteSpace:element.whiteSpace||'pre-wrap',textShadow:element.textShadow||'none',background:element.background||'transparent',display:'flex',alignItems:element.alignItems||'flex-start',justifyContent:element.justifyContent||'flex-start'}}>{element.text||''}</div>; }
function ImageLayer({element,frame,fps,customAnimations}) { return <Img src={element.src} style={{...styleFor(element,frame,fps,customAnimations),objectFit:element.objectFit||'cover'}} />; }
function VideoLayer({element,frame,fps,customAnimations}) { return <OffthreadVideo src={element.src} muted style={{...styleFor(element,frame,fps,customAnimations),objectFit:element.objectFit||'cover'}} />; }
function ShapeLayer({element,frame,fps,customAnimations}) { return <div style={{...styleFor(element,frame,fps,customAnimations),background:element.background||'#fff'}} />; }
function ButtonLayer({element,frame,fps,customAnimations}) { return <div style={{...styleFor(element,frame,fps,customAnimations),background:element.background||'#fff',color:element.color||'#000',fontFamily:element.fontFamily||'Arial,sans-serif',fontSize:Number(element.fontSize||32),fontWeight:element.fontWeight||700,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',textShadow:element.textShadow||'none'}}>{element.text||''}</div>; }

export const TemplateComposition = ({template={},data={},renderMode='preview'}) => {
  const frame = useCurrentFrame();
  const {fps,width,height} = useVideoConfig();
  const effectiveData = data && Object.keys(data).length ? data : (template.sampleData || {});
  const resolved = resolveTemplateValue(template,effectiveData);
  const background = resolved.background || {type:'solid',props:{color:'#000'}};
  const elements = Array.isArray(resolved.elements) ? resolved.elements : [];
  const customAnimations = Array.isArray(resolved.animations?.custom) ? resolved.animations.custom : [];
  return <AbsoluteFill style={{background:'#000',overflow:'hidden'}}>
    <BackgroundRenderer background={background} width={width} height={height} fps={fps} time={frame / fps} renderMode={renderMode} />
    {elements.slice().sort((a,b)=>Number(a.zIndex||0)-Number(b.zIndex||0)).map((element,index)=>{
      const key=element.id||`layer-${index}`;
      if(element.type==='text') return <TextLayer key={key} element={element} frame={frame} fps={fps} customAnimations={customAnimations}/>;
      if(element.type==='image') return <ImageLayer key={key} element={element} frame={frame} fps={fps} customAnimations={customAnimations}/>;
      if(element.type==='video') return <VideoLayer key={key} element={element} frame={frame} fps={fps} customAnimations={customAnimations}/>;
      if(element.type==='shape') return <ShapeLayer key={key} element={element} frame={frame} fps={fps} customAnimations={customAnimations}/>;
      if(element.type==='button') return <ButtonLayer key={key} element={element} frame={frame} fps={fps} customAnimations={customAnimations}/>;
      return null;
    })}
  </AbsoluteFill>;
};
