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
