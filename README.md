# cr8or-reel

Remotion-based video renderer with a data-driven template system and a browser visual editor.

## Architecture

- **Notion Projects** is the canonical source for project names when `NOTION_API_TOKEN` is configured.
- **Template JSON** contains the visual definition of a template.
- **Gemini / n8n** can provide content through the `data` object.
- **cr8or-reel** resolves `{{placeholders}}` and renders the template with Remotion.
- **Editor** lets you select a project, edit a template visually, manipulate layers, save JSON, and render MP4.

## Run

```bash
npm install
npm start
```

Open:

```text
http://localhost:3000/editor
```

## Notion

Set:

```text
NOTION_API_TOKEN=...
NOTION_PROJECTS_DATABASE_ID=083802c8-0e5d-48a4-809e-bd75af8a1334
```

The editor queries the Notion Projects database and dynamically detects its title property.

Without a Notion token, the editor uses the built-in fallback project list.

## Template format

Templates live in:

```text
data/templates/*.json
```

Example:

```json
{
  "version": 1,
  "id": "example",
  "name": "Example",
  "project": "EdVenture",
  "format": "reel",
  "canvas": {
    "width": 1080,
    "height": 1920,
    "fps": 30,
    "duration": 8
  },
  "sampleData": {
    "product": {
      "name": "Example product"
    }
  },
  "background": {
    "color": "#000000"
  },
  "elements": [
    {
      "id": "headline",
      "type": "text",
      "x": 100,
      "y": 800,
      "width": 880,
      "height": 200,
      "text": "{{product.name}}",
      "fontSize": 72,
      "fontWeight": 800,
      "color": "#ffffff",
      "animation": {
        "type": "fadeIn",
        "duration": 0.5,
        "easing": "easeOutCubic"
      }
    }
  ]
}
```

Supported visual layers:

- `text`
- `image`
- `video`
- `shape`
- `button`

Supported animations:

- `fadeIn`
- `fadeOut`
- `slideInUp`
- `slideInDown`
- `slideInLeft`
- `slideInRight`
- `scaleIn`
- `springIn`

## Render using a template

```http
POST /render
Content-Type: application/json
```

```json
{
  "templateId": "edventure-promo",
  "data": {
    "headline": "A generated headline",
    "buttonText": "Learn more",
    "product": {
      "name": "Cambridge Courses"
    }
  }
}
```

The renderer resolves placeholders before passing the template to Remotion.

## Legacy renderer

The existing generic `/render` mode remains available:

```json
{
  "background": "https://example.com/background.mp4",
  "elements": [
    {
      "type": "text",
      "x": 100,
      "y": 400,
      "width": 800,
      "height": 150,
      "text": "Hello"
    }
  ],
  "width": 1080,
  "height": 1920,
  "fps": 30,
  "duration": 8
}
```

The existing `EdventurePromo` Remotion composition remains available for backwards compatibility.

## Production persistence

The first editor implementation stores template JSON on the application filesystem. On an ephemeral hosting platform, filesystem changes may not survive a redeploy.

For production, the intended next persistence layer is either:

1. Git-backed template storage, or
2. the Notion Templates database.

The renderer API remains independent of that persistence decision.


## GitHub template persistence

When `GITHUB_TOKEN` is configured, the template editor uses GitHub as its persistent template store.

Set these environment variables:

```text
GITHUB_TOKEN=...
GITHUB_REPO_OWNER=deputy-proxy
GITHUB_REPO_NAME=cr8or-reel
GITHUB_REPO_BRANCH=main
GITHUB_TEMPLATE_DIR=data/templates
```

The token is used **only by the server** and is never exposed to the browser.

### Behavior

- `/api/templates` reads templates directly from GitHub.
- `/api/templates/:id` reads the selected template from GitHub.
- Saving an existing template updates its JSON file through the GitHub Contents API and creates a Git commit.
- Saving a new template creates a new JSON file and Git commit.
- If `GITHUB_TOKEN` is absent, the application falls back to the local filesystem.

The GitHub token should have the minimum repository contents permission required to read and write files in the repository. Do not put the token in frontend code or commit it to the repository.
