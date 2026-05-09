# Contributing to mlaify.io

This file covers contributing to the **website** at `mlaify/mlaify.github.io`. For contributions to a specific mlaify project (Aegis, AttackMap, OmekaRapper, OpenSift, OpenContractRx), file against that project's repository instead.

## Quick checklist for any PR

- `npm run build` succeeds without warnings.
- New pages have complete frontmatter (`title`, `description`, `date`, `lastmod`, `draft: false`).
- Internal links resolve (no `404`s).
- Markdown is formatted: `npm run format`.

## Common contributions

### Fix a typo, broken link, or wrong fact

Edit the markdown directly. The content tree is at `content/`. Open a PR with `fix:` in the title.

### Update a project's status

Each project page has a `status:` value in its frontmatter (`alpha`, `beta`, `stable`). When a project's actual status changes in its own repo, this site should follow within the same week.

### Expand a thin section

Most product pages reference deeper docs in the source repo. If a section here would benefit from more context, prefer **expanding the link target** (the source repo's docs) over duplicating it here. The site is the marketing + getting-started layer; the canonical docs live next to the code.

When local expansion is genuinely warranted (e.g., the source repo has no marketing-shaped writeup), follow the existing voice:

- Lead with what the thing *is* and what it's *for*.
- Be honest about status. "Alpha" means alpha.
- Link to the source for anything authoritative.

### Add a new project page to the open-source portfolio

1. Create `content/docs/project-<name>.md` with the standard frontmatter (copy `project-omekarapper.md` as a starting point).
2. Add a section to `content/docs/projects.md` with a one-paragraph summary and the project-page link.
3. Add a card to the homepage's "Open-source portfolio" strip in `layouts/index.html` (search for the existing OmekaRapper / OpenSift / OpenContractRx cards).

### Promote a portfolio project to a top-level section

If a project graduates from the portfolio into a headline product (the way Aegis and AttackMap have):

1. Create `content/<name>/_index.md` and the `getting-started`, `apps` (if relevant), and `faq` pages.
2. Add `layouts/<name>/list.html` and `single.html` (start by copying `layouts/aegis/`).
3. Add a brand color scale to `tailwind.config.js` (named after the product) and a `[data-accent="<name>"]` rule in `assets/css/app.css`.
4. Add a top-nav entry in `config/_default/menus/menus.en.toml`.
5. Add a card to the homepage's "Headline products" section.
6. Remove the project's old portfolio entry (`content/docs/project-<name>.md`) and its line in `content/docs/projects.md`.

### Add a new analyzer card to AttackMap

The catalog lives in `content/attackmap/analyzers.md`. Add a `{{</* feature */>}}` block. Tabler icon names matching `brand-*` for the language are preferred where available.

### Generate a real Open Graph image

The placeholder `cover.png` in `static/` is fine for now, but per-product OG images live better:

1. Create `static/og/og-<product>.png` at 1200×630 px.
2. Reference it from the section's `_index.md` frontmatter: `ogImage: "og/og-<product>.png"`.
3. Test the social embed using [opengraph.xyz](https://www.opengraph.xyz/) on the deploy preview URL.

## Style

- Sentences over fragments in body copy. Fragments are fine for feature card titles.
- No emojis in markdown unless the user request specifically calls for them.
- Code samples should be runnable. If they need context (like `cd repo` first), include it.
- Status badges and "what's not yet hardened" callouts are non-negotiable on product pages. They are how this site signals trust.

## Build hygiene

The build chain is sensitive to Hugo version and Node version mismatches. If you change either, update **both** of these files in the same PR:

- `netlify.toml` (`HUGO_VERSION`, `NODE_VERSION`)
- `.github/workflows/deploy.yml` (`HUGO_VERSION` env, `setup-node` `node-version`)

Tailwind config changes (`tailwind.config.js`) require a hard refresh of the dev server because the CSS is processed at Hugo startup. Stop and restart `npm run dev`.

## What lives where (decision guide)

| Want to change... | Edit |
|---|---|
| Page text | `content/<section>/<page>.md` |
| Top nav links | `config/_default/menus/menus.en.toml` |
| Footer links | same file (`[[footer]]` entries) |
| Site-wide colors / typography | `tailwind.config.js` and `assets/css/app.css` |
| Per-section brand color | `tailwind.config.js` (add scale) + `assets/css/app.css` (`[data-accent]` rule) |
| Header / footer markup | `layouts/_partials/header.html`, `footer.html` |
| Homepage layout | `layouts/index.html` |
| Default page chrome | `layouts/_default/single.html`, `list.html`, `baseof.html` |
| Section-specific chrome | `layouts/<section>/single.html`, `list.html` |
| Reusable markdown blocks | `layouts/shortcodes/*.html` |
| OG / metadata | `layouts/_partials/head.html` |
| JSON-LD schemas | `layouts/_partials/json-ld.html` |
| Build config | `netlify.toml`, `.github/workflows/deploy.yml`, `package.json` |

## Reporting issues

File against [`mlaify/mlaify.github.io`](https://github.com/mlaify/mlaify.github.io/issues). Include the URL, browser if relevant, and a screenshot for layout issues.

For security issues affecting the site (XSS, CSP regressions, header issues), see `SECURITY.md` in the repo root.

## Code of conduct

This project follows the [Contributor Covenant 3.0](./CODE_OF_CONDUCT.md). By participating in this project — opening issues, submitting PRs, commenting on discussions — you agree to abide by it.

Treat people well. Mistakes are expected; bad faith is not.

## License

- The **source code** in this repository is licensed under the [MIT License](./LICENSE).
- The **content** of the site (everything under `content/`, `static/`, and the rendered pages at `https://mlaify.io/`) is licensed under [CC BY-NC-SA 4.0](./CONTENT_LICENSE.md).

By contributing, you agree that your contributions will be licensed under those same terms.
