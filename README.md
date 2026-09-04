# Video Renderer

A small HTTP video-rendering service built with Express and Remotion.

## Endpoint

### GET /health

Returns service health.

### POST /render

Accepts JSON:

```json
{
  "background": "https://example.com/video.mp4",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "duration": 5,
  "compositionId": "Video",
  "outputFormat": "mp4",
  "elements": [
    {
      "type": "text",
      "id": "headline",
      "text": "HELLO FROM REMOTION",
      "x": 80,
      "y": 700,
      "fontSize": 90,
      "fontWeight": 800,
      "color": "#ffffff",
      "start": 0,
      "end": 5,
      "animation": "slideInUp"
    }
  ]
}
```

The `background` must be a remotely accessible video URL.

If `RENDER_SECRET` is configured, send the same value in:

```text
x-render-secret: ...
```

The service returns the rendered MP4 as the HTTP response.

## Railway

The service listens on the Railway-provided `PORT`.

For private networking from another service in the same Railway project/environment:

```text
http://cr8or-reel:<PORT>/render
```

Railway commonly provides port 8080 at runtime. Do not override Railway's `PORT` variable manually.
