# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI now builds on pull requests, not just pushes to `main`. The workflow is split into a `build` job (runs on both, no secrets, no environment) and a `deploy` job (`main` only, gated on `environment: production`). `environment:` cannot be applied conditionally, so a single job would have made pull requests wait on the production approval gate.
- `deploy` consumes the artifact `build` produced instead of rebuilding, so the bytes that ship are the bytes that passed the checks. `include-hidden-files: true` is required on the upload — it defaults to `false`, which would silently drop `public/.well-known/` and therefore `security.txt`.
- Build assertions for `public/404.html` and `public/.well-known/security.txt`, plus a post-download check that the artifact round trip preserved them.
- rsync now excludes `.DS_Store`, which was previously being published.
- `docs/superpowers/ops/fhrp-org-migration-runbook.md` — cutover runbook for the domain and host move.
- `docs/superpowers/ops/cloudflare-redirects-matthewd-xyz.csv` — Bulk Redirects list for `matthewd.xyz` → `fhrp.org`. A single catch-all row suffices because the path structure is unchanged.
- `Canonical` field in `.well-known/security.txt`.
- New theme foundation: Tailwind CSS 3, Pagefind 1.4 search, JetBrains Mono + Inter fonts.
- Personal copper accent palette (`#b45309` family) site-wide; Aegis (cyan) and AttackMap (amber) accents preserved for Phase 2.
- Editorial hero-stack homepage with avatar, tagline, latest-writing list.
- Blog post layout with cover image, post-meta (reading time, tags, date), share row (Bluesky + copy link), prev/next, and Giscus comments.
- Blog list layout with paginated two-column post grid.
- 404 page.
- Shortcodes ported from mlaify in preparation for Phase 2: `callout`, `status`, `cta`, `feature`, `feature-grid`, `app-badges`, `repo-link`.
- Hugo config split into `config/_default/*.toml` files (hugo, module, markup, params, languages, menus).
- All mlaify content imported with first-person voice edits: Aegis (8 pages), AttackMap (7 pages), OmekaRapper, OpenSift, OpenContractRx.
- `/principles/` page (formerly mlaify's `/build-principles/`), recast in first-person.
- `/contribute/` page recast in first-person with matthewd@matthewd.xyz as the contact.
- `/projects/` hub page listing all 5 projects with status badges, sorted by weight.
- Projects section on the homepage (top 2 as cards, smaller 3 as pill links).
- `[products]` table in `params.toml` configuring all 5 projects (name, tagline, status, accent, URL, repo URL).

### Changed
- **Canonical domain is now `fhrp.org`** (was `matthewd.xyz`). `baseurl`, JSON-LD, `privacy.json`, `humans.txt`, `security.txt`, and all content/email references updated. Bluesky profile URLs were deliberately left on `matthewd.xyz` — that handle is verified by the `_atproto.matthewd.xyz` TXT record and would break if rewritten.
- **Hosting moved from GitHub Pages to an InterServer VPS (LiteSpeed).** The reason is MIME control: GitHub Pages has no way to override `Content-Type`, and Apple/Jamf DDM requires strict `application/json`. `.github/workflows/hugo.yml` now builds and rsyncs `public/` over SSH with host-key pinning instead of publishing a Pages artifact. MIME types are configured on the host, not in this repo.
- `cloudflare-redirects-mlaify-io.csv` retargeted from `matthewd.xyz` to `fhrp.org` so `mlaify.io` resolves in one 301 rather than chaining through two.
- README hosting/theme/analytics facts corrected — it still claimed PaperMod, GitHub Pages, and GA4/Plausible, none of which were current.
- `privacy-policy.md`, `privacy.json`, `humans.txt`, and the footer no longer state that the site is hosted on GitHub infrastructure; they now name InterServer for hosting and GitHub for source and builds.
- Replaced PaperMod theme with a port of mlaify's custom Hugo theme.
- Moved Giscus partial from `layouts/partials/` to `layouts/_partials/`.
- CI: added Node, `npm ci`, and Pagefind index steps to GitHub Pages workflow.
- Footer "Archives" link now points to `/posts/` (the working blog index); `/archives/` 301-redirects there via Hugo alias for backward compatibility.
- `/posts/` renamed to `/writing/`. Old URLs (`/posts/<slug>/`) 301-redirect via Hugo aliases. `/archives/` → `/writing/`.
- `/me/` renamed to `/about/`. Old URL redirects via alias. Body rewritten to remove the "professional photographer" lead (medical retirement), merge mlaify's umbrella copy in first-person, and link to `/principles/` for the longer story.
- Top nav: Writing · Projects · About (was Posts · About). Footer gains Projects, Principles, and Contribute entries.
- Site tagline shortened to "Open source contributor and writer." Description aligned.
- Aegis `repoUrl` in `params.toml` now points to `mlaify/aegis-spec` (the protocol RFC repo) rather than a non-existent `mlaify/aegis`.
- OG default image points at `images/pic-mdavis-home.svg` until a dedicated 1200×630 PNG is designed.
- `config/_default/languages.toml` uses `locale`/`label` (Hugo ≥ 0.158 keys) instead of the deprecated `languageCode`/`languageName`.
- `CNAME` updated to a new 10-domain set: `matthewd.xyz`, `matthewd.org`, `fhrp.org`, `mlaify.io`, `mdavis.me`, `mldavis.me`, `mlphotography.me`, `rightsarchived.org`, `rightsinfocus.org`, `tffhrtp.org`. mlaify.io is now claimed by this repo's GH Pages so the mlaify org repo could be archived without losing the domain.
- mlaify.io paths now 301-redirect to matthewd.xyz via Cloudflare Bulk Redirects (Phase 3). The redirect list is checked into `docs/superpowers/ops/cloudflare-redirects-mlaify-io.csv`; the runbook is at `docs/superpowers/ops/phase-3-runbook.md`. Cloudflare's Bulk Redirects feature does not rewrite paths (only swaps hosts), so the 5 path-changing cases (`/build-principles/` → `/principles/`, `/docs/project-*` → `/<project>/`, `/privacy/` → `/privacy-policy/`) use Hugo `aliases` for the second hop.
- `mlaify/mlaify.github.io` repo archived as defense-in-depth (origin still serves a "moved" notice if a Cloudflare rule ever misses).

### Removed
- `CNAME` and `static/CNAME` — GitHub Pages custom-domain artifacts, meaningless on InterServer. Disable Pages on the repo so it stops serving and releases the `matthewd.xyz` claim.
- `.nojekyll` and `static/.nojekyll` — GitHub Pages artifacts.
- PaperMod theme submodule.
- `hugo.yaml` and `hugo_bak.yaml` (replaced by `config/_default/`).
- `content/search.md` (PaperMod Fuse-based search page; replaced by Pagefind).
- `content/posts/` directory (moved to `content/writing/`).
- `content/me.md` (folded into `content/about/_index.md`).
- Side domains opensift.org and siftbook.org sunset (CNAME claim removed from mlaify.github.io, DNS records deleted in Cloudflare).
- `callmemattd.com` and `littleabigails.com` no longer claimed by this repo's GH Pages (removed from CNAME).
