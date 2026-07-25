# Contributing

Thank you for your interest in contributing to `matthewd.xyz`. This site is a personal Hugo-based static site, but improvements, corrections, and suggestions are welcome.

By participating, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to Contribute

- **Report a bug or content issue** — open an issue using the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).
- **Suggest a feature or improvement** — open an issue using the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
- **Fix a typo or update content** — open a pull request directly.
- **Report a security vulnerability** — **do not open a public issue.** Follow the disclosure process in [`SECURITY.md`](SECURITY.md).

## Pull Request Process

1. Fork the repository and create a topic branch from `main`.
2. Make your changes. Keep them focused and scoped to a single purpose where possible.
3. Add an entry under `[Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md) for any user-facing change, following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.
4. Verify the site builds locally with `hugo server` and that no broken links or rendering issues are introduced.
5. Open a pull request against `main` using the PR template. Describe what changed and why.
6. Be responsive to review feedback. Squash or fixup commits as requested before merge.

## Style and Content Guidelines

- **Markdown:** Use standard CommonMark/Hugo-flavored markdown. Keep front matter consistent with existing posts.
- **Images:** Place post-specific images in the post bundle directory (e.g. `content/posts/post-N/images/`). Provide descriptive `alt` text.
- **Tone:** Match the existing voice of the site — direct, technical, and considerate.
- **Privacy:** Do not introduce trackers, third-party analytics, or external resources without discussion. The site is intentionally privacy-respecting and static-first.

## Local Development

```sh
# Clone with submodules (PaperMod theme)
git clone --recurse-submodules https://github.com/mdavistffhrtporg/mdavistffhrtporg.github.io.git
cd mdavistffhrtporg.github.io

# Run a local dev server
hugo server -D
```

The site will be available at `http://localhost:1313/`.

## Licensing

By contributing, you agree that your contributions will be licensed under the terms of the project:

- Code and configuration: [MIT License](LICENSE)
- Written content and original media: [CC BY-NC-SA 4.0](CONTENT_LICENSE.md)
