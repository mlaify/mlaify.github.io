# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- CI now builds on pull requests, not just pushes to `main`. The workflow is split into a `build` job (runs on both, no secrets, no environment) and a `deploy` job (`main` only, gated on `environment: production`). `environment:` cannot be applied conditionally, so a single job would have made pull requests wait on the production approval gate.
- `deploy` consumes the artifact `build` produced instead of rebuilding, so the bytes that ship are the bytes that passed the checks. `include-hidden-files: true` is required on the upload — it defaults to `false`, which would silently drop `public/.well-known/` and therefore `security.txt`.
- Build assertions for `public/404.html` and `public/.well-known/security.txt`, plus a post-download check that the artifact round trip preserved them.
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
- **Hosting moved from GitHub Pages to the InterServer VPS (LiteSpeed). The domain is unchanged — `matthewd.xyz`.** `.github/workflows/hugo.yml` builds and rsyncs `public/` over SSH with host-key pinning instead of publishing a Pages artifact. Nothing in `content/` or `config/` changes: `baseurl`, canonical URLs, JSON-LD, `security.txt`, and `privacy.json` were already correct. MIME types and error/index behaviour are configured on the host, not here.
- Removed `CNAME`, `static/CNAME`, `.nojekyll`, `static/.nojekyll` — GitHub Pages artifacts. Set Pages to None on the repo so it stops serving and releases the custom-domain claim.
- The deploy no longer curls the live site after rsyncing. matthewd.xyz sits behind Cloudflare, which issues a JS challenge to non-browser clients and returns 403 to Actions runners (`cf-mitigated: challenge`) — that put a red X on an earlier InterServer deploy that had actually succeeded. rsync's exit status is the real signal.
- README theme/analytics facts corrected — it claimed PaperMod and GA4/Plausible, neither of which was current.

#### History: the fhrp.org detour

The site briefly moved to `fhrp.org` on InterServer, to gain `Content-Type`
control for an Apple account-driven-enrollment file that GitHub Pages serves as
`application/octet-stream`. That was reverted to `matthewd.xyz` / GitHub Pages,
and then the hosting move was redone on `matthewd.xyz` itself — the current
state. The deploy machinery is the same one that fhrp.org proved works.

Note: the revert restored the domain but missed the hosting *statements* in
`README.md`, `humans.txt`, `privacy.json`, `content/privacy-policy.md`, and the
footer, which continued to name InterServer while the site was on Pages. They
are accurate again now.

The enrollment file is still hosted outside this repo. It must be served from
the apex of the domain matching the Managed Apple IDs — Apple derives the
discovery URL from the Managed Apple ID's email domain — so it cannot move to a
subdomain. Now that matthewd.xyz has MIME control, it could be committed here
**if** the Managed Apple IDs are `@matthewd.xyz`; that is still unconfirmed. See
`docs/superpowers/ops/apple-enrollment-file.md`.
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
- `.DS_Store` and `static/.DS_Store`. Both were tracked, so the existing `.DS_Store` entry in `.gitignore` never applied to them — gitignore only affects untracked files. `static/.DS_Store` was copied into `public/` by Hugo and published, leaking directory metadata.
- `static/.well-known/com.apple.remotemanagement`. Apple requires this served as `application/json`, and GitHub Pages has no MIME mapping for an extensionless file. It is served from the InterServer host instead, so shipping it from here would only publish a copy with the wrong `Content-Type`.
- PaperMod theme submodule.
- `hugo.yaml` and `hugo_bak.yaml` (replaced by `config/_default/`).
- `content/search.md` (PaperMod Fuse-based search page; replaced by Pagefind).
- `content/posts/` directory (moved to `content/writing/`).
- `content/me.md` (folded into `content/about/_index.md`).
- Side domains opensift.org and siftbook.org sunset (CNAME claim removed from mlaify.github.io, DNS records deleted in Cloudflare).
- `callmemattd.com` and `littleabigails.com` no longer claimed by this repo's GH Pages (removed from CNAME).
