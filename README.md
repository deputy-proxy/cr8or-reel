# Video Renderer

A small self-hosted Remotion rendering API intended to run as a separate Railway service next to an existing n8n deployment.

The repository includes the Remotion CLI explicitly because `npx remotion browser ensure` requires `@remotion/cli` to be installed.

Remotion renders real MP4 videos from React compositions. This service accepts a JSON scene definition, renders one video at a time, and returns the MP4 response.

## Important licensing note

Remotion's current website states that its free license is available to individuals and companies of up to 3 people, including commercial use, subject to its terms. Review the current license before production use.

## Deploy to Railway

1. Create a new private GitHub repository.
2. Copy this repository into it.
3. In your existing Railway project, add a **new service** from the GitHub repository.
4. Railway will detect the Dockerfile.
5. Set:
   - `PORT=3000`
   - `RENDER_SECRET=<long-random-secret>`
   - `RENDER_CONCURRENCY=4`
6. Give the renderer its own CPU/RAM allocation. A starting point around 4-6 vCPU and 4-6 GB RAM is reasonable for one 1080p render at a time.
7. Generate a Railway public domain for the renderer, or use Railway private networking if the caller is another Railway service.

Do not modify or redeploy the existing n8n service just to add this renderer.

## Test

Health check:

GET /health

Render:

POST /render

Header:

x-render-secret: <your secret>

Example body:

{
  "background": "https://example.com/background.mp4",
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "duration": 10,
  "elements": [
    {
      "type": "image",
      "src": "https://example.com/logo.png",
      "x": 70,
      "y": 80,
      "width": 300,
      "height": 300,
      "start": 0,
      "end": 10,
      "animation": "fadeIn"
    },
    {
      "type": "text",
      "text": "30 DAYS",
      "x": 70,
      "y": 650,
      "fontSize": 110,
      "fontWeight": 800,
      "color": "#ffffff",
      "start": 1,
      "end": 10,
      "animation": "slideInUp"
    }
  ]
}

The endpoint currently returns the rendered MP4 directly.

## Current supported elements

### image

- `src`
- `x`
- `y`
- `width`
- `height`
- `opacity`
- `scale`
- `rotation`
- `start`
- `end`
- `animation`

Animations:
- `none`
- `fadeIn`
- `fadeOut`
- `slideInUp`
- `slideInDown`
- `slideInLeft`
- `slideInRight`
- `scaleIn`

### text

All image positioning/animation properties plus:

- `text`
- `fontSize`
- `fontFamily`
- `fontWeight`
- `lineHeight`
- `color`
- `textAlign`
- `whiteSpace`

## Production improvements

This first version intentionally keeps the service small.

For production, the next changes should be:

1. Upload source assets to S3/R2 rather than passing large files through n8n.
2. Store rendered MP4s in S3/R2 instead of returning large binary responses through n8n.
3. Add a job queue/status API for long renders.
4. Add a render lock so only one job is processed at a time.
5. Add request validation and maximum duration/dimensions.
6. Add custom font loading if your compositions use brand fonts.
7. Add audio handling if required.
8. Add retries and cleanup of abandoned temporary files.

## Architecture

Laravel / app
    |
    v
n8n
    |
    | HTTP POST /render
    v
Remotion renderer
    |
    +-- React composition
    +-- Chromium
    +-- FFmpeg
    |
    v
MP4
    |
    v
S3 / R2
