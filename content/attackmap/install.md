---
title: "Install"
description: "Install the AttackMap CLI with Homebrew, uv or pip, and the macOS app."
weight: 20
---

AttackMap needs Python 3.11 or later. It isn't on PyPI: releases come from GitHub,
the [M&L AI package index](https://pkg.mlaify.io/) and the
[Homebrew tap](https://github.com/mlaify/homebrew-tap).

## Homebrew

The CLI with all 15 official analyzer plugins:

```bash
brew install mlaify/tap/attackmap
```

## uv or pip, from the package index

The CLI with every analyzer plugin, from pkg.mlaify.io:

```bash
uv tool install "attackmap[all]" --index mlaify=https://pkg.mlaify.io/pypi/simple/ --index-strategy first-index
```

Core only, straight from GitHub (add analyzers later with `attackmap suggest . --install`
or `-m <name>`):

```bash
pipx install git+https://github.com/mlaify/AttackMap.git
```

The `[llm]` extra adds the Anthropic and OpenAI SDKs for the API backends of the AI
review. The CLI backends (`claude`, `codex`) need nothing extra.

## The macOS app

A native front end that drives the same CLI. The cask installs the CLI too:

```bash
brew install --cask mlaify/tap/attackmap-app
```

Or download the DMG from
[AttackMap-mac releases](https://github.com/mlaify/AttackMap-mac/releases/latest). It
needs macOS 15 or later.

## Check it

```bash
attackmap --help
attackmap modules        # the analyzers installed
attackmap analyze /path/to/repo --output reports
```

Then open `reports/defensive-review.md`. The
[quickstart](https://docs.mlaify.io/attackmap/quickstart/) walks through the reports,
and the [install guide](https://docs.mlaify.io/attackmap/install/) covers CI.
