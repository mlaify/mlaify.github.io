---
title: "Contribute"
description: "How to file issues, send patches, run analyzers, and otherwise contribute to mlaify open-source projects."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 30
toc: true
sidebar: false
lead: "Every mlaify project lives on GitHub. Pick the one you care about and pick the contribution that fits your time."
---

## Where everything lives

- **GitHub organization**: [github.com/mlaify](https://github.com/mlaify)
- **This site's source**: [mlaify/mlaify.github.io](https://github.com/mlaify/mlaify.github.io)

Every project page on this site links to its repo. That repo is the canonical source of truth for code, docs, issues, and discussion.

## Five-minute contributions

You don't have to write code to be useful.

- **File an issue when something is wrong on this site.** Broken link, wrong status, missing info, typo, accessibility problem — file against [mlaify/mlaify.github.io](https://github.com/mlaify/mlaify.github.io).
- **Run a project against your own repo and tell us what happened.** Especially [AttackMap](/attackmap/getting-started/) — analyzer coverage and route-extraction accuracy improve fastest with real-world targets.
- **Watch a repo.** Aegis and AttackMap both signal `v0.1` upcoming releases through GitHub releases.

## Hour-long contributions

- **Improve a project page on this site.** Spotted a thin section in `content/aegis/` or `content/attackmap/`? PR welcome. Content is markdown; the [README](https://github.com/mlaify/mlaify.github.io) covers the structure.
- **Write a small analyzer for AttackMap.** If the language or framework you use isn't [in the catalog](/attackmap/analyzers/), the analyzer SDK is small. Start from the [getting-started guide](/attackmap/getting-started/).
- **Run the Aegis CLI quickstart end-to-end and file ergonomic issues.** First-impressions feedback is gold for a `v0.1` CLI.

## Day-long contributions

- **Send a substantive patch** to whichever repo you've been using. Bug fix, new feature, doc improvement — every repo has issues tagged for help.
- **Author or refine a protocol RFC** in [aegis-spec](https://github.com/mlaify/aegis-spec). The protocol is still draft; this is the highest-leverage place to contribute if you have crypto or messaging-protocol experience.
- **Stand up a public Aegis relay.** Federation is part of the design and we'd like it to be exercised in real life.

## Conventions

- **License.** Each repo's license is in its `LICENSE` file (MIT unless specified otherwise). Contributions follow the repo's license.
- **PR style.** Match the existing style. Run formatters/linters. Keep PRs scoped — small, single-purpose changes get reviewed faster.
- **Security disclosure.** For security-impacting issues, follow the disclosure policy in the relevant repo's `SECURITY.md`. Do not file public issues for unpatched vulnerabilities.
- **Code of conduct.** Treat people well. Mistakes are expected; bad faith is not.

## Contact

- **Issues** — open in the relevant repository.
- **Discussions** — every repo has GitHub Discussions enabled.
- **Security** — `SECURITY.md` in the relevant repository for disclosure protocol.

There is no shared chat, mailing list, or Slack. Conversation lives next to the code it's about.
