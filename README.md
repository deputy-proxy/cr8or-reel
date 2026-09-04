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


## Browser runtime

The Docker image installs Debian Chromium and its runtime libraries before running
`remotion browser ensure`. This is intentional: Remotion's downloaded Chrome
headless shell dynamically links against system libraries such as `libnspr4`.


## EdventurePromo template

The renderer includes an `EdventurePromo` Remotion composition designed from the
provided EdVenture reference artwork.

It expects:

```json
{
  "template": "EdventurePromo",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "duration": 8,
  "data": {
    "bgImage": "https://example.com/background.jpg",
    "headline": "Cambridge nu se pregătește doar pe hârtie.",
    "buttonText": "Programează evaluarea gratuită"
  }
}
```

Animation sequence:
1. Background image is visible immediately.
2. Orange gradient fades up from the bottom.
3. Headline appears character by character.
4. White CTA button slides upward into view after the headline.

The template uses `data.bgImage`, so the top-level `background` field is not
required for this template.
