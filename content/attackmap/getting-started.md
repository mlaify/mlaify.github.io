---
title: "Getting started with AttackMap"
description: "Install AttackMap, run your first scan, understand the output artifacts, and wire it into CI — all in one page."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 10
toc: true
accent: "attackmap"
lead: "Install, run, and read AttackMap's output in under ten minutes."
---

## Prerequisites

- Python 3.11 or later
- `pip` (or `uv`, `pipx`)
- A local copy of the repository you want to analyze

AttackMap has no runtime dependencies beyond Python's standard library. The `anthropic` SDK is optional and only needed if you pass `--llm`.

## Install

```bash
# Standard pip
pip install attackmap

# With optional LLM support
pip install attackmap[llm]

# Recommended: isolated environment
python -m venv .venv && source .venv/bin/activate
pip install attackmap
```

Verify the install:

```bash
attackmap --help
```

## Run your first scan

```bash
# Analyze the current directory, write reports to ./reports/
attackmap analyze .

# Analyze a specific path
attackmap analyze /path/to/my-repo

# Specify a different output directory
attackmap analyze . --output security-review

# Markdown output only (skip JSON artifacts)
attackmap analyze . --format markdown

# JSON output only
attackmap analyze . --format json
```

The command walks the repository, runs all applicable analyzers, and writes a `reports/` directory. A typical run on a medium-sized codebase (50k lines) takes 3–10 seconds.

## Understanding the output

Seven files are produced. They build on each other:

```
reports/
├── architecture.md             ← where to start reading
├── attack-surface.md           ← entry-point inventory
├── defensive-review.md         ← prioritized findings + recommendations
├── defensive-review.json       ← machine-readable version of the above
├── review-context-pack.json    ← analyzer metadata for downstream tools
└── attackmap-report.json       ← monolithic: everything in one file
```

### architecture.md

System overview. Read this first.

- Languages detected
- Total routes by method + path
- Data stores (database kinds found)
- External calls (outbound HTTP targets)
- Auth signal summary
- Entry-point concentration warnings

### attack-surface.md

Classified entry-point inventory. Routes are ordered by risk:

| Section | What it contains |
|---|---|
| Priority view | High-risk routes first, with category and rationale |
| High-risk routes | Webhooks, admin endpoints, file uploads |
| Auth/admin routes | Routes bearing auth signals |
| Public routes | Externally exposed, no auth detected |
| Internal/health routes | Lower exposure |
| External dependencies | Outbound HTTP targets |
| Secrets and auth hints | Secret-shaped environment variable names |

**Route categories:**

| Category | Meaning |
|---|---|
| `webhook` | External callbacks — high trust-boundary risk |
| `admin` | Administrative operations — privilege escalation surface |
| `auth` | Login, token, session, password routes |
| `upload` | File or blob ingestion — injection and traversal surface |
| `internal` | Service-to-service, not internet-facing |
| `health` | Liveness / readiness probes |
| `public_api` | General API surface |

### defensive-review.md

The main actionable output. Sections:

1. **System overview** — concise architecture summary
2. **Findings** — ordered by severity (high → medium → low), each with:
   - Title and severity
   - Evidence list (what was observed in code)
   - Mitigation advice
   - Confidence level (high/medium/low)
   - MITRE ATT&CK technique IDs
3. **Assets** — high-value resources detected with criticality ratings
4. **Controls** — defensive mechanisms present, absent, or weak
5. **Notable observations** — cross-cutting insights (11 insight kinds)
6. **Detection opportunities** — runtime signal hints for SIEM/logging
7. **Recommendations** — ordered action list

### defensive-review.json

Structured JSON following the published schema (`schemas/defensive-review.schema.json`). Contains every field from the markdown review plus:

- `raw_structured_signals` — the full route/database/auth/secret inventory
- `attack_techniques_observed` — deduplicated MITRE ATT&CK list
- `evidence_chains` — attack paths with named steps and impact
- `limitations_meta` — source-quality warnings (test/fixture paths)

This file is the recommended integration point for downstream tooling.

## Running specific analyzers

By default, AttackMap runs built-in analyzers (Python web, JavaScript web, default) and any ecosystem analyzers already installed. To target a specific ecosystem:

```bash
# Run only the Python analyzer
attackmap analyze . --module python

# Run only Go
attackmap analyze . --module go

# Run multiple
attackmap analyze . --module python --module node_service

# Auto-install missing analyzer from mlaify GitHub org
attackmap analyze . --module java_spring
```

The `--module` flag auto-installs the named analyzer from the `mlaify` GitHub organization if it is not already present. See [Analyzers](/attackmap/analyzers/) for the full list.

## Listing installed analyzers

```bash
attackmap modules
```

Output shows:
- Locally installed analyzers (name, version, description, scope)
- Available analyzer repositories on GitHub under the `mlaify` org

## Adding LLM-powered narrative

The `--llm` flag adds a `defensive-review-llm.md` file — a prose defensive review written by Claude. The LLM sees only the structured evidence pack (assets, controls, insights, attack paths, ATT&CK techniques), not raw source code.

```bash
# Auto-detect auth backend (API key → OAuth token → claude CLI)
attackmap analyze . --llm

# Force API key backend
attackmap analyze . --llm --llm-backend api

# Force claude CLI backend (uses your Pro/Max subscription)
attackmap analyze . --llm --llm-backend cli

# Choose model and effort
attackmap analyze . --llm --llm-model claude-opus-4-7 --llm-effort high
```

**Auth backend resolution order (auto):**

1. `ANTHROPIC_API_KEY` environment variable → Anthropic SDK (per-token billing)
2. `ANTHROPIC_AUTH_TOKEN` environment variable → Anthropic SDK (OAuth bearer)
3. `claude` binary on PATH → shells out to the CLI (uses your subscription)

**Effort tiers:** `low` `medium` `high` (default) `xhigh` `max`

**Output written to:**
- `reports/defensive-review-llm.md` — prose narrative
- `reports/defensive-review-llm.meta.json` — run metadata (model, backend, tokens used, stop_reason)

If the LLM call fails, AttackMap still completes and writes all non-LLM artifacts. The failure is logged to stderr.

## Wiring into CI

### GitHub Actions

```yaml
name: Security review

on: [pull_request]

jobs:
  attackmap:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install AttackMap
        run: pip install attackmap

      - name: Run analysis
        run: attackmap analyze . --output reports --format json

      - name: Upload review artifacts
        uses: actions/upload-artifact@v4
        with:
          name: attackmap-reports
          path: reports/
```

### GitLab CI

```yaml
attackmap:
  image: python:3.12-slim
  script:
    - pip install attackmap
    - attackmap analyze . --output reports --format json
  artifacts:
    paths:
      - reports/
    expire_in: 30 days
```

### Reading exit codes

| Exit code | Meaning |
|---|---|
| `0` | Analysis complete, no errors |
| `1` | Analysis complete, critical findings present (when `--fail-on-high` is set) |
| `2` | Fatal error (bad path, unreadable files, etc.) |

## Source quality warnings

AttackMap tracks whether signals come from test or fixture code. Paths matching `/tests/`, `/__tests__/`, `/fixtures/`, `/mocks/`, `/examples/` are flagged as low-quality.

Low-quality signals are **not suppressed** — they appear in the raw JSON — but are down-ranked in recommendations and labeled with an explicit `evidence_class: low_quality` flag. If all your auth signals come from test code, the review will call that out.

## Next steps

- [Analyzers reference](/attackmap/analyzers/) — all 13 ecosystem analyzers
- [Architecture deep-dive](/attackmap/architecture/) — pipeline, data models, SDK contracts
- [Use cases](/attackmap/use-cases/) — CI gating, unknown-repo onboarding, architecture review prep
- [Custom analyzer SDK](/attackmap/sdk/) — build your own ecosystem analyzer
