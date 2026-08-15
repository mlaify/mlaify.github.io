# mlaify.io

Personal website and blog, built with Hugo and served on Cloudflare Workers.

This site contains long-form writing, technical notes, and project pages.

## License

- Code and configuration are licensed under the MIT License.
- Written content and original media are licensed under CC BY-NC-SA 4.0 unless otherwise noted.

---

## ✨ Overview

- **Framework:** Hugo (static site generator)
- **Theme:** Custom Tailwind theme (in-repo, no submodule)
- **Search:** Pagefind
- **Hosting:** Cloudflare Workers static assets, built and deployed by Workers Builds
- **DNS / CDN:** Cloudflare
- **Comments:** Giscus (GitHub Discussions)
- **Analytics:** None
- **License:** MIT (code), CC BY-NC-SA 4.0 (content)

The site is intentionally static for performance, security, and longevity.

---

## 🚀 Deploy

Cloudflare **Workers Builds** clones this repo on push, runs the build itself,
and deploys the result as Workers static assets. There is no GitHub Actions
workflow, no SSH key, no rsync, and no origin server.

| | |
|---|---|
| Worker | `mlaify-io` |
| Config | [`wrangler.jsonc`](wrangler.jsonc) |
| Production branch | `main` → `https://mlaify.io` |
| Any other branch | preview URL, not promoted to production |

### Build settings (Cloudflare dashboard)

Workers & Pages → `mlaify-io` → Settings → Build:

| Setting | Value |
|---|---|
| Build command | `npm run build:cf` |
| Deploy command | `npx wrangler deploy` |
| Non-production deploy command | `npx wrangler versions upload` |
| Root directory | *(blank)* |

`build:cf` lives in [`package.json`](package.json) so the actual steps stay in
version control and the dashboard holds only the entry point. It runs `npm ci`,
Hugo, Pagefind, then [`scripts/check-build.sh`](scripts/check-build.sh), which
fails the build if `index.html`, `404.html`, `pagefind/`, `security.txt`, or
`_headers` are missing. A build that fails never becomes a deployment.

### Toolchain pinning

The build image's defaults are not the versions this site is built with, so both
are pinned:

| Tool | Pinned to | Where |
|---|---|---|
| Node.js | 24.12.0 | [`.nvmrc`](.nvmrc) |
| Hugo | 0.162.1 | `HUGO_VERSION` build variable |
| wrangler | 4.114.0 | `devDependencies` in `package.json` |

`HUGO_VERSION` is the one that cannot live in the repo — set it under Settings →
Build → **Variables and Secrets**. Without it the build silently uses the image
default (extended 0.147.7).

Go and Dart Sass are **not** needed; the CSS pipeline is Tailwind via PostCSS and
there are no Hugo module imports, only local mounts.

### Headers

[`static/_headers`](static/_headers) is the single source of truth for security
and cache headers. Hugo copies it to `public/_headers`, Cloudflare consumes it at
deploy time, and it is not itself served. If a Cloudflare Transform Rule also
sets these headers, remove one side — duplicated security headers are worse than
none.

### Local

```bash
npm run build:cf && npm run preview
```

`preview` runs `wrangler dev`, which serves `public/` through the same asset
router as production — trailing-slash behaviour, the 404 page, and `_headers`
all apply, which `hugo server` does not reproduce.

---

## 📁 Repository Structure

```text
.
├── content/            # Blog posts, pages, and written content
│   ├── writing/        # Blog posts
│   └── ...             # Project and standalone pages
├── static/             # Images, favicon, humans.txt, _headers, etc.
├── layouts/            # Templates (the theme lives here)
├── assets/             # CSS, JS, processed assets
├── config/_default/    # Site configuration
├── scripts/            # check-build.sh — build output assertions
├── wrangler.jsonc      # Cloudflare Workers config (assets, routes)
├── .github/            # Issue/PR templates, CODEOWNERS
└── README.md
```
