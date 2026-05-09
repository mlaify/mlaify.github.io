<!--
Thanks for contributing to mlaify.io. Fill in whichever sections apply.
For trivial fixes (typo, broken link), feel free to delete sections that don't apply.
-->

## Summary

<!-- A short, plain-English description of what this PR changes and why. -->

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature or page (non-breaking addition)
- [ ] Content update (copy, fact, status change, link fix)
- [ ] Theme / layout change
- [ ] Config / build change (`netlify.toml`, `deploy.yml`, `package.json`, Hugo config, etc.)
- [ ] Documentation only
- [ ] Breaking change (existing URL, layout contract, or shortcode signature changes)

## Test plan

<!--
How did you verify this works? Examples:
- [x] `npm run build` completes with no warnings
- [x] `/aegis/` and `/aegis/getting-started/` render correctly in `npm run dev`
- [x] Internal links resolve (no 404s)
- [x] Mobile nav and dark/light toggle still work
- [x] Lighthouse scores unchanged on the affected page
-->

## Checklist

- [ ] `npm run build` succeeds without warnings
- [ ] Markdown is formatted (`npm run format`)
- [ ] New pages have complete frontmatter (`title`, `description`, `date`, `lastmod`, `draft: false`)
- [ ] Internal links resolve
- [ ] `CHANGELOG.md` updated under `[Unreleased]` (required for any user-facing change)
- [ ] If this changes the build chain, both `netlify.toml` and `.github/workflows/deploy.yml` are updated together
- [ ] If this introduces a new section or layout, the corresponding `[data-accent]` rule, brand color scale, and nav entries are wired up

## Related issues / context

<!-- Link any related issues, PRs, or external context. e.g., "Closes #42" -->
