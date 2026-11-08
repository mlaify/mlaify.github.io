---
title: "Install"
description: "Install grrclone with Homebrew or from the DMG. Apple Silicon, macOS 14 or later."
weight: 20
---

grrclone runs on Apple Silicon Macs with macOS 14 or later.

## Homebrew

```bash
brew install --cask mlaify/tap/grrclone
```

Homebrew owns updates: `brew update && brew upgrade --cask grrclone`. grrclone can be
asked to *check* for new releases, but it never replaces its own bundle.

It comes from the M&L AI tap rather than homebrew-cask because homebrew-cask asks for
a minimum number of stars, forks or watchers that a new project doesn't have yet. The
cask passes audit, and it will move to homebrew-cask unchanged once it qualifies.

## DMG

Download the latest DMG from
[Releases](https://github.com/mlaify/grrclone/releases/latest) and drag grrclone to
Applications. It's signed and notarised, so Gatekeeper opens it without a warning.

Every release carries a Sigstore-signed provenance attestation:

```bash
gh attestation verify grrclone.dmg --repo mlaify/grrclone
```

## First run

grrclone appears in the menu bar, with no Dock icon. It finds the remotes already in
your `rclone.conf` and lists them; connect one and it appears in Finder, under
`~/grrclone` by default. It reads `rclone.conf` but never writes it, so your
command-line setup keeps working as before.

If you already mount remotes with a launchd job, see
[Migrating from a hand-rolled launchd mount](https://github.com/mlaify/grrclone/blob/main/docs/migrating.md),
which keeps your paths.
