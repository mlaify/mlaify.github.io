---
title: "AttackMap"
description: "A defensive security analysis engine that reads your source code, maps attack surfaces, and produces prioritized evidence-anchored findings — local-first, no cloud account required."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
accent: "attackmap"
---

{{< status "alpha" >}}

## What AttackMap is

AttackMap is a **local-first, open-source defensive security analysis engine**. Point it at a repository and it reads source code, reconstructs the attack surface from first principles, and produces prioritized, evidence-anchored findings — without sending code off-device and without a cloud subscription.

It is built to answer four questions any security engineer asks at the start of a review:

1. **What is exposed?** Routes, external calls, data egress, and secrets in the wrong places.
2. **What does this system look like to an attacker?** Entry points, data stores, trust crossings.
3. **What are the realistic attack chains?** Not isolated findings — plausible paths with steps and impact.
4. **What should we fix first?** Prioritized by practical risk reduction, with evidence attached.

{{< callout type="note" >}}
AttackMap is a **defensive** tool. Output is oriented entirely toward remediation and improved posture. It produces no exploit code, offensive payloads, or actionable attack instructions.
{{< /callout >}}

## Features

{{< feature-grid cols="4" >}}

{{< feature icon="puzzle" title="Modular analyzer ecosystem" >}}
13 community analyzer plugins covering Python, Node/TypeScript, Go, Java/Spring, .NET, Rust, PHP (Laminas + generic), C, C++, Terraform, AT Protocol, and Omeka-S — each a separate pip-installable package, discovered at runtime via Python entry points.
{{< /feature >}}

{{< feature icon="arrow-right-bar" title="Five-stage pipeline" >}}
Recon → Merge → Translation → Security Overlay → Reporting. Each stage has a stable contract. Results from any stage can be consumed independently as structured JSON.
{{< /feature >}}

{{< feature icon="shield-search" title="Attack surface classification" >}}
Every detected route is classified by category (webhook, admin, auth, upload, internal, health, public_api), exposure level (public, internal, unknown), and risk tier (low, medium, high), with a per-route rationale list.
{{< /feature >}}

{{< feature icon="database-lock" title="Asset and control modeling" >}}
Detects high-value assets (credentials, PII, payment, audit logs, session tokens) and maps defensive controls — which are present, which are absent, and how strong each is.
{{< /feature >}}

{{< feature icon="sitemap" title="MITRE ATT&amp;CK mapping" >}}
Findings, insights, and detection opportunities are mapped to specific ATT&amp;CK technique IDs — T1190, T1552, T1078, T1199, and 12 others — so output integrates with threat intelligence workflows.
{{< /feature >}}

{{< feature icon="file-code" title="Machine-readable JSON artifacts" >}}
Every stage of output is available as stable JSON with published schemas. Every field has an evidence chain. Suitable for CI gates, dashboards, and eval harnesses.
{{< /feature >}}

{{< feature icon="radar" title="Detection opportunities" >}}
Beyond findings, AttackMap emits defender-facing runtime signal hints: structured Sigma/KQL-style rule sketches derived from observed attack paths and cross-cutting insights.
{{< /feature >}}

{{< feature icon="sparkles" title="Optional LLM narrative" >}}
`--llm` generates a Claude-powered prose defensive review. Supports API key, OAuth token, and claude CLI backends. Five effort tiers. The LLM sees only your evidence pack, never raw source.
{{< /feature >}}

{{< /feature-grid >}}

## How a run works

The pipeline is five stages. Every stage produces machine-readable output; every stage is replaceable via the SDK.

```
Source code
    │
    ▼
[1] Recon Collection
    Analyzers (built-in + plugins) walk the repo and emit typed signals:
    Routes, ExternalCalls, DatabaseHints, AuthHints, ServiceHints,
    EdgeHints, EntrypointHints, ProtocolHints, FrameworkHints, SecretHints

    ▼
[2] Merge
    Deduplication by (key, file) pairs. One unified ScanResult.

    ▼
[3] Translation  (recon_to_analysis gateway)
    Auth-hint filtering removes non-auth metadata.
    Parallel translation:
      Routes         → AttackSurface  (category + exposure + risk + rationale)
      Routes + hints → Finding        (severity + mitigation + ATT&CK techniques)
      Routes + svcs  → AttackPath     (named chains with impact)

    ▼
[4] Security Overlay
    Cross-cutting view: Assets, Controls (present + absent + strength),
    Insights (11 insight kinds), DetectionOpportunities

    ▼
[5] Reporting
    architecture.md  attack-surface.md  defensive-review.md
    defensive-review.json  review-context-pack.json  attackmap-report.json
    (optional) defensive-review-llm.md  (requires --llm)
```

## Quick start

```bash
pip install attackmap

# Analyze the current directory
attackmap analyze .

# Specify output directory
attackmap analyze . --output my-reports

# Enable LLM prose review (uses claude CLI by default)
attackmap analyze . --llm

# Run a specific ecosystem analyzer only
attackmap analyze . --module python

# List installed and available analyzers
attackmap modules
```

See [Getting Started](/attackmap/getting-started/) for the full walkthrough.

## Output at a glance

Running `attackmap analyze .` produces a `reports/` directory:

| File | Format | Description |
|---|---|---|
| `architecture.md` | Markdown | System overview — languages, routes, datastores, auth summary |
| `attack-surface.md` | Markdown | Classified routes by risk tier, auth coverage, exposure |
| `defensive-review.md` | Markdown | Prioritized findings, controls, assets, recommendations |
| `defensive-review.json` | JSON | Machine-readable review with full evidence chains |
| `review-context-pack.json` | JSON | Analyzer metadata and context for downstream tools |
| `attackmap-report.json` | JSON | Monolithic output: all of the above in one file |
| `defensive-review-llm.md` | Markdown | LLM-generated prose review (`--llm` only) |

## What's strong, what's maturing

{{< callout type="note" >}}
**Strong today:** modular analyzer execution with entry-point discovery, framework-aware route extraction (FastAPI/Flask/Express/Spring/axum/chi), chain-aware threat modeling, source-quality weighting, stable machine-readable JSON artifacts, 13-plugin ecosystem, local eval harness.

**Still maturing:** hint taxonomy migration (the `auth_hints` field is being decoupled from non-auth metadata), deeper detection-opportunity rule generation, richer service-topology graphing, relay federation.
{{< /callout >}}

## Repositories

- [mlaify/AttackMap](https://github.com/mlaify/AttackMap) — core engine
- [mlaify/attackmap-analyzer-python](https://github.com/mlaify/attackmap-analyzer-python) — Python/Django/FastAPI/Flask
- [mlaify/attackmap-analyzer-node-service](https://github.com/mlaify/attackmap-analyzer-node-service) — Node.js/TypeScript
- [mlaify/attackmap-analyzer-go](https://github.com/mlaify/attackmap-analyzer-go) — Go
- [mlaify/attackmap-analyzer-java-spring](https://github.com/mlaify/attackmap-analyzer-java-spring) — Java/Spring
- [Browse all analyzers →](https://github.com/orgs/mlaify/repositories?q=attackmap-analyzer)

{{< cta url="/attackmap/getting-started/" variant="primary" label="Get started" >}}
{{< cta url="https://github.com/mlaify/AttackMap" variant="ghost" label="View on GitHub" >}}
