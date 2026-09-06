import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
import { TemplateComposition } from '../src/TemplateComposition.jsx';
import { ChromeCarousel } from '../src/templates/ChromeCarousel.jsx';
import { EdventurePromo } from '../src/templates/EdventurePromo.jsx';
import { BackgroundRenderer } from '../src/backgrounds/BackgroundRenderer.jsx';
import './preview.css';

const RENDERERS={Template:TemplateComposition,ChromeCarousel,EdventurePromo};
const frames=t=>Math.max(1,Math.round(Number(t?.canvas?.duration||8)*Number(t?.canvas?.fps||30)));
class ErrorBoundary extends React.Component{constructor(p){super(p);this.state={error:null}}static getDerivedStateFromError(error){return{error}}componentDidCatch(error){this.props.onError?.(error)}render(){return this.state.error?<div className="status error">{this.state.error.message||String(this.state.error)}</div>:this.props.children}}
function App(){
 const playerRef=useRef(null), [template,setTemplate]=useState(null), [time,setTime]=useState(0), [status,setStatus]=useState('Waiting for template…'), [fullscreen,setFullscreen]=useState(false), [background,setBackground]=useState(null);
 const q=new URLSearchParams(location.search), id=q.get('template'), backgroundId=q.get('background'), embedded=q.get('embedded')==='1';
 const isBackground=Boolean(backgroundId);
 useEffect(()=>{
   if(isBackground){
     setStatus('Loading background…');
     const initial={type:backgroundId,props:{}};
     setBackground(initial); setStatus('');
     const onMessage=e=>{ if(e.source!==parent)return; const m=e.data||{};
       if(m.type==='background-preview:set'){setBackground(m.background||initial);setTime(Number(m.time||0));}
       if(m.type==='background-preview:seek'){setTime(Number(m.time||0));}
     };
     window.addEventListener('message',onMessage);
     parent.postMessage({type:'background-preview:ready'},'*');
     return()=>window.removeEventListener('message',onMessage);
   }
   if(embedded) return;
   if(!id){setStatus('No template selected');return;}
   fetch(`/api/templates/${encodeURIComponent(id)}`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||`Request failed: ${r.status}`);return d}).then(setTemplate).catch(e=>setStatus(e.message));
 },[id,embedded,isBackground,backgroundId]);
 useEffect(()=>{
   if(isBackground)return;
   const onMessage=e=>{if(e.source!==parent)return;const m=e.data||{};
     if(m.type==='renderer-preview:set-template'){
       setTemplate(m.template||null);setTime(Number(m.time||0));
       requestAnimationFrame(()=>playerRef.current?.seekTo?.(Math.round(Number(m.time||0)*Number(m.template?.canvas?.fps||30))));
     }
     if(m.type==='renderer-preview:seek'){setTime(Number(m.time||0));playerRef.current?.seekTo?.(Math.round(Number(m.time||0)*Number(template?.canvas?.fps||30)));}
     if(m.type==='renderer-preview:play')playerRef.current?.play?.();
     if(m.type==='renderer-preview:pause')playerRef.current?.pause?.();
   };
   window.addEventListener('message',onMessage);
   parent.postMessage({type:'renderer-preview:ready'},'*');
   return()=>window.removeEventListener('message',onMessage);
 },[isBackground,template]);
 const enterFullscreen=()=>{document.documentElement.requestFullscreen?.().then(()=>setFullscreen(true)).catch(()=>{});};
 if(isBackground && background) return <div className="background-preview-root"><BackgroundRenderer background={background} width={1080} height={1920} fps={30} time={time} native renderMode="preview" /></div>;
 if(!template)return <div className="status">{status}</div>;
 const Component=RENDERERS[template.renderer||'Template']||TemplateComposition;const width=Number(template.canvas?.width||1080),height=Number(template.canvas?.height||1920),fps=Number(template.canvas?.fps||30);
 return <div className="preview-root fullscreen-preview"><ErrorBoundary onError={e=>parent.postMessage({type:'renderer-preview:error',message:e.message},'*')}><Player ref={playerRef} component={Component} inputProps={{template,data:template.sampleData||{}}} durationInFrames={frames(template)} compositionWidth={width} compositionHeight={height} fps={fps} controls={false} clickToPlay={false} style={{width:'100%',height:'100%'}}/></ErrorBoundary><button className="preview-fullscreen" onClick={enterFullscreen}>{fullscreen?'Exit fullscreen':'Fullscreen'}</button></div>;
}
createRoot(document.getElementById('root')).render(<App/>);
