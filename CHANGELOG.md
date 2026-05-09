# Changelog

All notable changes to this site are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **`CONTENT_LICENSE.md`** — explicit CC BY-NC-SA 4.0 license for site content (separate from the existing MIT license that covers source code).
- **`CODE_OF_CONDUCT.md`** — Contributor Covenant 3.0.
- **`.github/PULL_REQUEST_TEMPLATE.md`** — checklist-style PR template aligned with the project's build-hygiene rules (CHANGELOG entry, `npm run build` passes, paired Hugo + Node version updates, etc.).
- **`.github/FUNDING.yml`** — GitHub Sponsors enabled (`mdavistffhrtporg`); other platforms left commented for future opt-in.
- **`.github/CODEOWNERS`** — `* @mdavistffhrtporg` as sole code owner.

### Changed

- **`CONTRIBUTING.md`** — Code of conduct section now links to the new `CODE_OF_CONDUCT.md` instead of being a one-liner; new License section explains the dual MIT (code) + CC BY-NC-SA 4.0 (content) split and notes that contributions are licensed under those same terms.
- **Replaced personal email addresses with role-based contacts.** Security-disclosure files now use `security@matthewd.xyz` and `security@mlaify.io` (`SECURITY.md`, `content/security.md`, `content/aegis/security.md`, `content/aegis/faq.md`, `static/.well-known/security.txt`). Privacy and general-contact files now use `privacy@matthewd.xyz` and `privacy@mlaify.io` (`content/privacy.md`, `static/privacy.json`, `static/humans.txt`). No instances of the previous personal addresses remain in tracked sources.
- **OmekaRapper project page** (`/docs/project-omekarapper/`) significantly expanded with full architecture detail sourced from the OmekaRapper docs site: provider matrix and request strategy, curator workflow, PDF + OCR behavior, runtime flow, controller endpoints, response schema, request/apply/failure policies, configuration reference, installation, FAQ, and troubleshooting. Confirms the new repo location at [mlaify/OmekaRapper](https://github.com/mlaify/OmekaRapper) and clarifies what is intentionally out of scope today (no Python worker, no pgvector, no transcription, no review queue).
- `/docs/projects/` blurb for OmekaRapper updated with provider list, PDF+OCR support, async behavior, and the suggest-and-apply (never silent) framing.

### Added

- **Custom Hugo theme** built on Tailwind CSS v3 + Pagefind, replacing the previous Doks/Thulite theme. Includes dark mode, mobile navigation, on-site search, JSON-LD structured data, and per-product accent colors.
- **Aegis section** under `/aegis/` with 8 pages (~2,050 lines): landing page, getting-started walkthrough, apps overview (web + iOS + macOS + Android + CLI), security model, architecture, protocol reference, release notes, and FAQ.
- **AttackMap section** under `/attackmap/` with 7 pages (~2,225 lines): landing page, getting-started, all 13 ecosystem analyzers, architecture deep-dive, custom analyzer SDK guide, use cases, and FAQ.
- New top-level pages: `/about/`, `/build-principles/`, `/contribute/`.
- New layouts: custom `baseof`, section landings for Aegis and AttackMap, hero/feature-grid/app-badges/json-ld partials, and reusable shortcodes (`cta`, `feature`, `feature-grid`, `callout`, `status`, `app-badges`, `repo-link`).
- New JS: `theme-toggle.js`, `search.js` (Pagefind dynamic loader with HEAD probe), `mobile-nav.js`.
- Tailwind config with `ink` / `brand` / `aegis` / `attackmap` color scales and the `@tailwindcss/typography` plugin.
- `CONTRIBUTING.md` describing tiered contribution paths, conventions, and build hygiene.
- Pagefind static search index added to the build pipeline.

### Changed

- **Replaced the entire theme stack.** Removed Doks/Thulite Hugo modules and SCSS; added Tailwind CSS, PostCSS, Pagefind, and `@tabler/icons` (mounted from `node_modules` for inline SVG).
- **Reorganized the information architecture.** Top nav is now Aegis / AttackMap / Open Source / About. Aegis and AttackMap are first-class product sections; OmekaRapper / OpenSift / OpenContractRx remain in the open-source portfolio with expanded individual pages.
- `package.json`: removed all `@thulite/*` dependencies; added `tailwindcss`, `@tailwindcss/typography`, `postcss`, `postcss-cli`, `autoprefixer`, `pagefind`. Added `build`, `build:hugo`, `build:search`, and `dev:full` scripts.
- `netlify.toml`: pinned Hugo to `0.160.1`, Node to `20.18.0`, build command now runs Pagefind after Hugo, CSP updated for self-hosted Inter and JetBrains Mono fonts.
- `.github/workflows/deploy.yml`: pinned Hugo and Node versions, separate `build:hugo` and `build:search` steps, npm caching.
- `config/_default/hugo.toml`, `params.toml`, `module.toml`, `markup.toml`, `languages.toml`, `menus.en.toml`: rewritten for the custom theme; removed Doks-specific blocks; per-product params for Aegis and AttackMap.
- Existing portfolio project pages expanded: `project-omekarapper.md`, `project-opencontractrx.md`, `project-opensift.md`.
- `README.md` rewritten to cover the new stack, content authoring guide, brand tokens, and deployment.
- `content/security.md` and `content/privacy.md` frontmatter updated to use the new theme's `layout: single` / `sidebar: false` conventions.

### Removed

- Doks/Thulite theme files: `assets/scss/common/_custom.scss`, `_variables-custom.scss`, `assets/js/custom.js`, `layouts/home.html`, `layouts/_partials/head/custom-head.html`, `layouts/_partials/head/script-header.html`, `layouts/_partials/footer/script-footer-custom.html`.
- Stale Doks Dutch menu (`config/_default/menus/menus.nl.toml`) that was causing Hugo to emit an `nl/` language output.
- Old `/docs/`-namespaced pages that have moved to top-level: `content/docs/about.md`, `build-principles.md`, `contribute-contact.md`, `direction.md`, `project-aegis.md` (Aegis is now a top-level section).

## [0.2.1] - 2026-05-08

### Added

- `SECURITY.md` at repository root following the [disclose.io](https://disclose.io) vulnerability disclosure framework.
- `/security/` page mirroring the disclosure policy in a site-friendly format.
- `/privacy/` page describing how the static site handles visitor data (no analytics, no ad tracking, no first-party cookies).
- `static/.well-known/security.txt` for machine-readable security contact discovery (expires 2027-05-08).
- `static/humans.txt` describing the site, stack, and contact details.
- `static/privacy.json` providing a structured (v1.0) privacy declaration.

### Changed

- All references to "ML AI LLC" and "M&L AI LLC" replaced with "mlaify" across content, configs, and static files.
- Standalone "ML AI Project Hub" / "ML AI" brand references normalized to "mlaify" everywhere they appear as the project or organization name.
- `.claude/` added to `.gitignore` so Claude Code worktrees and session state stay out of the repository.
