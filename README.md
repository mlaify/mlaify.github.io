# mlaify.io

Source for [mlaify.io](https://mlaify.io) — the product hub for [Aegis](https://mlaify.io/aegis/), [AttackMap](https://mlaify.io/attackmap/), and the rest of the [mlaify open-source portfolio](https://mlaify.io/docs/projects/).

Built with [Hugo](https://gohugo.io) on a fully custom theme. Tailwind CSS v3 via Hugo Pipes for styling. [Pagefind](https://pagefind.app) for static post-build search.

## Stack

- **Hugo** (extended) `0.160.1` — pinned in `netlify.toml` and `.github/workflows/deploy.yml`.
- **Node.js** 20+ — for Tailwind, PostCSS, and Pagefind during build.
- **Tailwind CSS** 3.4 — entry at `assets/css/app.css`, config in `tailwind.config.js`.
- **Pagefind** 1.x — runs after Hugo to produce `public/pagefind/`.
- **Tabler Icons** — mounted from `node_modules/@tabler/icons` and inlined via the `svg-icon` partial.

The site does **not** use any Hugo theme module. Layouts and partials live entirely in `layouts/`.

## Local development

```bash
npm install
npm run dev          # hugo server on :1313 (no Pagefind index)
npm run build        # hugo + pagefind, output in public/
npm run build:hugo   # hugo only
npm run build:search # pagefind only (after a hugo build)
```

The dev server serves Pagefind's index at runtime only after a `build:search` has run; the `dev` script does not run Pagefind. To exercise search locally, do `npm run build` and `npx serve public`.

## Repository layout

```
config/
  _default/        # canonical site config
  production/      # production environment overrides
content/
  _index.md        # homepage frontmatter (layout: index)
  aegis/           # Aegis product section
  attackmap/       # AttackMap product section
  about/           # /about/
  build-principles/
  contribute/
  docs/            # open-source portfolio (sub-pages, no top-level marketing)
layouts/
  index.html       # homepage layout
  404.html
  robots.txt
  _default/        # baseof, single, list
  _partials/       # head, header, footer, hero, feature-grid, sidebar, toc, etc.
  shortcodes/      # markdown-callable: feature, feature-grid, callout, status, cta, app-badges
  aegis/           # section-specific overrides (single, list)
  attackmap/       # section-specific overrides (single, list)
assets/
  css/app.css      # Tailwind entry + components
  js/              # theme-toggle, mobile-nav, search
  images/          # OpenSift screenshots; product images go here
static/
  CNAME
  favicon.ico, icon.svg, apple-touch-icon.png, cover.png
  og/              # Open Graph images (see static/og/README.md)
  .well-known/     # Aegis universal links — DO NOT remove
```

## Authoring content

### Adding a page in an existing section

```bash
hugo new aegis/new-page.md
# or just create it manually with the frontmatter below.
```

Minimum frontmatter:

```yaml
---
title: "Page title"
description: "One-sentence description used for meta + social."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 50          # ordering within section sidebar
toc: true           # show inline TOC if heading count warrants
accent: "aegis"     # aegis | attackmap | (omit for default)
lead: "Optional larger paragraph rendered above the body."
---
```

Aegis pages should set `accent: "aegis"`. AttackMap pages should set `accent: "attackmap"`. Everything else can omit `accent` and inherits the indigo brand palette.

### Adding a new top-level section

1. Create `content/<section>/_index.md` with the frontmatter above (no `weight` needed for sections).
2. If the section needs custom chrome, add `layouts/<section>/list.html` and `layouts/<section>/single.html` — copy the Aegis or AttackMap layouts as a starting point.
3. Add an entry to `config/_default/menus/menus.en.toml` if you want the section in the top nav.

### Shortcodes

Available in any markdown file:

| Shortcode | Purpose |
|---|---|
| `{{</* feature-grid cols="3" */>}} ... {{</* /feature-grid */>}}` | Grid wrapper for feature cards. |
| `{{</* feature icon="x" title="Y" */>}}body{{</* /feature */>}}` | Single feature card. Icon names match Tabler outline icons. |
| `{{</* callout type="note\|warn\|security" title="..." */>}}body{{</* /callout */>}}` | Highlight box. |
| `{{</* status "alpha\|beta\|stable" */>}}` | Inline status badge. |
| `{{</* cta url="/x/" label="Click" variant="primary\|ghost" */>}}` | Standalone CTA button. |
| `{{</* app-badges platforms="ios,macos,android" */>}}` | App Store / Play Store / Mac App Store "Coming soon" cards. |
| `{{</* repo-link url="..." label="..." */>}}` | Inline GitHub repo link with icon. |

### Iconography

Use any [Tabler outline icon](https://tabler.io/icons) by name. Icons are mounted from `node_modules/@tabler/icons/icons/` and inlined at render time. To use one in a layout:

```go-html-template
{{ partial "svg-icon.html" (dict "name" "shield" "class" "h-5 w-5") }}
```

## Brand tokens

Defined in `tailwind.config.js`:

- **Ink** (neutrals) — `ink-50` … `ink-950`
- **Brand** (parent indigo) — `brand-50` … `brand-900`
- **Aegis** (deep teal/cyan) — `aegis-50` … `aegis-900`
- **AttackMap** (amber) — `attackmap-50` … `attackmap-900`

Per-section accent variables are defined in `assets/css/app.css` under `[data-accent="aegis"]` / `[data-accent="attackmap"]`. Set `accent:` in front matter to switch the accent for a content page; the layout adds `data-accent` on the section wrapper.

## Deployment

- **GitHub Pages**: pushes to `main` deploy via `.github/workflows/deploy.yml`. Hugo version is pinned via the workflow's `HUGO_VERSION` env.
- **Netlify**: deploys via `netlify.toml`. Hugo version is pinned in `[build.environment]`.

Both run `hugo --gc --minify` followed by `pagefind --site public`.

## Domain

`mlaify.io` is set via `static/CNAME` — Hugo copies that file to `public/CNAME` at build time, which GitHub Pages reads. Do not remove.

`static/.well-known/apple-app-site-association` and `static/.well-known/assetlinks.json` are required for Aegis universal links and credential delegation. **Do not remove or rename.**

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).
