import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Player } from '@remotion/player';
import { TemplateComposition } from '../src/TemplateComposition.jsx';
import { ChromeCarousel } from '../src/templates/ChromeCarousel.jsx';
import { EdventurePromo } from '../src/templates/EdventurePromo.jsx';
import { LightfallTemplate } from '../src/templates/LightfallTemplate.jsx';
import './preview.css';

const RENDERERS = {
  Template: TemplateComposition,
  ChromeCarousel,
  EdventurePromo,
  LightfallTemplate,
};

function frameCount(template) {
  return Math.max(1, Math.round(Number(template?.canvas?.duration || 8) * Number(template?.canvas?.fps || 30)));
}

function App() {
  const playerRef = useRef(null);
  const [template, setTemplate] = useState(null);
  const [status, setStatus] = useState('Loading renderer…');
  const query = new URLSearchParams(window.location.search);
  const id = query.get('template');

  useEffect(() => {
    let alive = true;
    if (!id) {
      setStatus('No template selected');
      return;
    }
    fetch(`/api/templates/${encodeURIComponent(id)}`)
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `Request failed: ${r.status}`);
        return d;
      })
      .then(t => alive && setTemplate(t))
      .catch(e => alive && setStatus(e.message));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    const onMessage = event => {
      if (event.source !== window.parent) return;
      const message = event.data || {};
      if (message.type === 'renderer-preview:set-template' && message.template) {
        setTemplate(message.template);
        setStatus('');
        requestAnimationFrame(() => playerRef.current?.seekTo?.(Math.round(Number(message.time || 0) * Number(message.template.canvas?.fps || 30))));
      }
      if (message.type === 'renderer-preview:seek') {
        const fps = Number(template?.canvas?.fps || 30);
        playerRef.current?.seekTo?.(Math.round(Number(message.time || 0) * fps));
      }
      if (message.type === 'renderer-preview:play') playerRef.current?.play?.();
      if (message.type === 'renderer-preview:pause') playerRef.current?.pause?.();
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({ type: 'renderer-preview:ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, [template]);

  if (!template) return <div className="status">{status}</div>;

  const rendererName = template.renderer || 'Template';
  const Component = RENDERERS[rendererName] || TemplateComposition;
  const width = Number(template.canvas?.width || 1080);
  const height = Number(template.canvas?.height || 1920);
  const fps = Number(template.canvas?.fps || 30);
  const durationInFrames = frameCount(template);

  return (
    <div className="preview-root">
      <Player
        ref={playerRef}
        component={Component}
        inputProps={{ template, data: template.sampleData || {} }}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        style={{ width: '100%', height: '100%' }}
      />
      <div className="renderer-badge">{rendererName}</div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
