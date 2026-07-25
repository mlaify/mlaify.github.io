---
title: "Contribute"
description: "How to file issues, send patches, run analyzers, and otherwise contribute to my open-source projects."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 30
toc: true
sidebar: false
lead: "Every project I maintain lives on GitHub. Pick the one you care about and pick the contribution that fits your time."
---

## Where everything lives

- **GitHub**: [github.com/mlaify](https://github.com/mlaify)
- **This site's source**: [mlaify/mlaify.github.io](https://github.com/mlaify/mlaify.github.io)

Every [project page](/projects/) on this site links to its repo. That repo is the canonical source of truth for code, docs, issues, and discussion.

## Five-minute contributions

You don't have to write code to be useful.

- **File an issue when something is wrong on this site.** Broken link, wrong status, missing info, typo, accessibility problem — file against [mlaify/mlaify.github.io](https://github.com/mlaify/mlaify.github.io).
- **Run a project against your own repo and tell me what happened.** Especially [AttackMap](/attackmap/getting-started/) — analyzer coverage and route-extraction accuracy improve fastest with real-world targets.
- **Watch the repo.** [AttackMap](https://github.com/mlaify/AttackMap) signals upcoming releases through GitHub releases.

## Hour-long contributions

- **Improve a project page on this site.** Spotted a thin section in `content/attackmap/`? PR welcome. Content is markdown.
- **Write a small analyzer for AttackMap.** If the language or framework you use isn't [in the catalog](/attackmap/analyzers/), the analyzer SDK is small. Start from the [getting-started guide](/attackmap/getting-started/).

## Day-long contributions

- **Send a substantive patch** to whichever repo you've been using. Bug fix, new feature, doc improvement — every repo has issues tagged for help.
- **Add ecosystem coverage to AttackMap.** A new analyzer plugin, better route extraction, or a new detector — real-world targets are where coverage improves fastest.

## Conventions

- **License.** Each repo's license is in its `LICENSE` file (MIT unless specified otherwise). Contributions follow the repo's license.
- **PR style.** Match the existing style. Run formatters/linters. Keep PRs scoped — small, single-purpose changes get reviewed faster.
- **Security disclosure.** For security-impacting issues, follow the disclosure policy in the relevant repo's `SECURITY.md`. Do not file public issues for unpatched vulnerabilities.
- **Code of conduct.** Treat people well. Mistakes are expected; bad faith is not.

## Contact

- **Issues** — open in the relevant repository.
- **Discussions** — every repo has GitHub Discussions enabled.
- **Security** — `SECURITY.md` in the relevant repository for disclosure protocol.
- **Everything else** — reach out to me at [matthewd@matthewd.xyz](mailto:matthewd@matthewd.xyz).

Conversation lives next to the code it's about. I don't run a shared chat, mailing list, or Slack.
