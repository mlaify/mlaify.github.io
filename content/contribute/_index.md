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
- **Run a project on your own hardware and tell me what happened.** Especially [Tamper Tripwire](/tripwire/) — failed-credential and motion event behavior varies by device and Android build, and real-device reports are how validation coverage grows.
- **Watch the repo.** [grapheneos-tripwire](https://github.com/mlaify/grapheneos-tripwire) signals upcoming releases through GitHub releases.

## Hour-long contributions

- **Improve a project page on this site.** Spotted a thin section in `content/tripwire/`? PR welcome. Content is markdown.
- **Validate an event path on your device.** Build [Tamper Tripwire](https://github.com/mlaify/grapheneos-tripwire) against your own collector and deliberately test a failed unlock, a reboot, or locked motion — then report which events reached the collector on your exact device and OS build.

## Day-long contributions

- **Send a substantive patch** to whichever repo you've been using. Bug fix, new feature, doc improvement — every repo has issues tagged for help.
- **Harden Tamper Tripwire.** Collector-side alerting examples, reboot-persistence testing, long-duration reliability runs, or documentation for an additional validated device — the repo's issues list what still needs proving.

## Conventions

- **License.** Each repo's license is in its `LICENSE` file (MIT unless specified otherwise). Contributions follow the repo's license.
- **PR style.** Match the existing style. Run formatters/linters. Keep PRs scoped — small, single-purpose changes get reviewed faster.
- **Security disclosure.** For security-impacting issues, follow the disclosure policy in the relevant repo's `SECURITY.md`. Do not file public issues for unpatched vulnerabilities.
- **Code of conduct.** Treat people well. Mistakes are expected; bad faith is not.

## Contact

- **Issues** — open in the relevant repository.
- **Discussions** — every repo has GitHub Discussions enabled.
- **Security** — `SECURITY.md` in the relevant repository for disclosure protocol.
- **Everything else** — reach out to me at [mlaify@mlaify.io](mailto:mlaify@mlaify.io).

Conversation lives next to the code it's about. I don't run a shared chat, mailing list, or Slack.
