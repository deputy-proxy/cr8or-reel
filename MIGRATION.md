# Migration

Replace the corresponding files in your repository with the files from this archive.

New pieces:

- `src/template-system.js`
- `src/TemplateComposition.jsx`
- `public/editor.html`
- `public/editor.js`
- `public/editor.css`
- `data/templates/edventure-promo.json`
- `data/projects.json`

Updated pieces:

- `src/server.js`
- `src/remotion-entry.jsx`
- `src/VideoComposition.jsx`
- `README.md`
- `package.json`

The editor is available at `/editor`.

## Environment

For Notion project names:

```text
NOTION_API_TOKEN=...
NOTION_PROJECTS_DATABASE_ID=083802c8-0e5d-48a4-809e-bd75af8a1334
```

For GitHub-backed template persistence:

```text
GITHUB_TOKEN=...
GITHUB_REPO_OWNER=deputy-proxy
GITHUB_REPO_NAME=cr8or-reel
GITHUB_REPO_BRANCH=main
GITHUB_TEMPLATE_DIR=data/templates
```

`GITHUB_TOKEN` is server-side only. Never expose it to the browser.

With the GitHub token configured, templates are read from and saved directly to GitHub. Every save creates a Git commit, so template history is retained by GitHub.

Without the GitHub token, the editor falls back to the local `data/templates` directory.


## React component rendering architecture

React component source files under `src/user-components/` are now the runtime source of truth. Template-embedded `react.code` is retained for portability and editing, but loading/rendering a template no longer overwrites an existing component source file. Missing component files can still be bootstrapped from embedded template code.

The editor's React layer preview is rendered directly in the preview iframe rather than through a nested Remotion Player. Final template previews and MP4 renders continue to use Remotion. Template variables are resolved inside the canonical `TemplateComposition`, so editor data and Remotion output use the same resolved values.


## v7 rendering fixes
- Template preview now resolves sampleData placeholders exactly like editor/render.
- React component iframe uses a ready handshake plus retries so props cannot be lost during iframe startup.
- React props accept both `reactProps` and legacy `react.props`, with control defaults.
- Lightfall uses explicit component dimensions as a fallback for WebGL sizing.
- Lightfall template no longer embeds a second copy of its source code.

## v8 composition architecture

Templates now use a fixed, full-canvas `background` object and normal editable `elements` above it.

```json
{
  "background": {
    "type": "lightfall",
    "props": {}
  },
  "animations": {
    "custom": []
  },
  "elements": []
}
```

Legacy Lightfall React layers are automatically migrated to the background configuration when a template is loaded or saved.

The editor no longer exposes arbitrary React components as scene layers. React Bits backgrounds are selected from the predefined background catalog, while Text, Shape, Button, Image and Video remain editable layers.

Reveal animations are defined in `src/animations/animation-registry.js`. Custom animations are stored in the template's `animations.custom` array and can be assigned to any compatible layer.

## v9 composition editor changes

- Backgrounds are fixed full-canvas template properties, not resizeable layers.
- The right inspector shows background settings only when no layer is selected.
- Selecting a layer shows its layer inspector and style controls.
- Added common style properties: padding, box shadow, text shadow, border, border radius, backdrop blur and blend mode.
- Preview template mode is embedded explicitly and no longer performs a second template lookup, avoiding stale "Template not found" states in the editor.
- Preview requests browser fullscreen from the Preview action and the standalone preview is full-viewport with a fullscreen control.
- Render failures now surface both the high-level error and the renderer message.
- Lightfall gracefully falls back when WebGL cannot be initialized in a rendering environment.
