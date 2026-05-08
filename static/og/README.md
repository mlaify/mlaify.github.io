# Open Graph images

This directory holds 1200x630 PNG images used as default OG/Twitter images.

Required files:

- `og-default.png` — fallback used by every page that doesn't override
- `og-aegis.png` — Aegis section pages (referenced via `ogImage` in `content/aegis/_index.md`)
- `og-attackmap.png` — AttackMap section pages (referenced via `ogImage` in `content/attackmap/_index.md`)

Each image should:

- Be 1200×630 pixels (Open Graph standard).
- Show the product name clearly on the dark theme palette.
- Avoid critical text in the outer 5% (gets cropped by some social embeds).

Until proper OG images exist, the head partial falls back to `/cover.png`.

## Generating placeholders

If you don't have a designer handy, you can render a temporary OG image with any tool that exports 1200×630 PNG. Hugo will serve whatever lives at this path; nothing in the build pipeline transforms or validates it.
