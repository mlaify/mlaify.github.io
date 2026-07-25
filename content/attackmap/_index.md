---
title: "AttackMap"
description: "A defensive security analysis engine that reads your source code, maps attack surfaces, and produces prioritized evidence-anchored findings — local-first, no cloud account required."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-07-06T00:00:00-05:00
draft: false
accent: "attackmap"
---

{{< status "beta" >}}

**Full documentation:** [docs.matthewd.xyz](https://docs.matthewd.xyz) — install, quickstart, CLI reference, AI review, the macOS app, and the analyzer SDK.

## What AttackMap is

AttackMap is a **local-first, open-source defensive security analysis engine**. Point it at a repository and it reads source code, reconstructs the attack surface from first principles, and produces prioritized, evidence-anchored findings — without sending code off-device and without a cloud subscription.

It is built to answer four questions any security engineer asks at the start of a review:

1. **What is exposed?** Routes, external calls, data egress, and secrets in the wrong places.
2. **What does this system look like to an attacker?** Entry points, data stores, trust crossings.
3. **What are the realistic attack chains?** Not isolated findings — plausible paths with steps and impact.
4. **What to fix first?** Prioritized by practical risk reduction, with evidence attached.

{{< callout type="note" >}}
AttackMap is a **defensive** tool. Output is oriented entirely toward remediation and improved posture. It produces no exploit code, offensive payloads, or actionable attack instructions.
{{< /callout >}}

## Features

{{< feature-grid cols="4" >}}

{{< feature icon="puzzle" title="Modular analyzer ecosystem" >}}
14 community analyzer plugins covering Python, Node/TypeScript, Go, Java/Spring, .NET, Rust, PHP (Laminas + generic), C, C++, Terraform, IaC (Docker/Compose/GitHub Actions), AT Protocol, and Omeka-S — each a separate pip-installable package, discovered at runtime via Python entry points. `attackmap suggest` recommends the right set for a repo.
{{< /feature >}}

{{< feature icon="arrow-right-bar" title="Five-stage pipeline" >}}
Recon → Merge → Translation → Security Overlay → Reporting. Each stage has a stable contract. Results from any stage can be consumed independently as structured JSON.
{{< /feature >}}

{{< feature icon="git-branch" title="Data-flow / injection detection" >}}
A lightweight import-graph taint pass (**Python, JS/TS, Go, and PHP**) traces request-to-sink reachability and flags SSRF, SSTI, NoSQL injection, unsafe deserialization, code/command execution, open redirect, and dynamic file open — gated on request-container access, parameterized-SQL awareness, and per-language import resolution (Go module-path, PHP PSR-4 autoload) for precision.
{{< /feature >}}

{{< feature icon="bug" title="Novel vulnerability-class detectors" >}}
Per-file detectors for bug classes beyond the taint families: prototype pollution, mass assignment, JWT weakness (alg=none / unverified), XXE, ReDoS, insecure upload, and GraphQL introspection exposure — each anchored on a concrete risky construct, ATT&amp;CK-mapped.
{{< /feature >}}

{{< feature icon="shield-lock" title="Broken authorization (BOLA/IDOR)" >}}
Flags routes that take a resource id, reach a datastore, and have no ownership check nearby — OWASP API #1 — by composing routes, per-route auth attribution, and taint reachability into one finding.
{{< /feature >}}

{{< feature icon="key" title="Insecure crypto &amp; web hardening" >}}
Flags weak hashing/ciphers, ECB, static IV/salt, insecure RNG for secrets, and broken TLS verification — plus web-hardening misconfigurations (wildcard CORS with credentials, disabled CSRF, insecure cookies, unsafe-inline CSP, shipped debug mode).
{{< /feature >}}

{{< feature icon="zoom-exclamation" title="Anomaly & invariant mining" >}}
Surfaces the odd-one-out among sibling routes — a handler that breaks the auth, validation, or method norm its resource cohort establishes — plus **signature-free invariant mining**: infer an implicit rule from repeated structure (handlers guard a request before a sink) and flag the site that violates it. Confidence scales with how consistent the cohort is.
{{< /feature >}}

{{< feature icon="flame" title="Exploitability fusion" >}}
Fuses sink danger, exposure, entry-route auth, reachability, and data sensitivity into a deterministic, fully-explainable 0–100 "exploitable now" score, ranking route→sink combinations so the highest real risk leads the report.
{{< /feature >}}

{{< feature icon="package" title="SBOM + CVE cross-reference" >}}
Inventories direct dependencies across five ecosystems and, with `--cve`, cross-references OSV.dev (cached, offline-tolerant) to surface known-vulnerable packages inline with the architecture narrative.
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

{{< feature icon="crosshair" title="Vulnerability-hypothesis hunting + verify jury" >}}
`--hunt` has an LLM reason over the full evidence pack as a red-team analyst and propose ranked, evidence-cited exploit-chain **hypotheses** — human-verifiable leads, not detections. `--hunt --verify` adjudicates each lead against the cited source, and scales into a jury: `--verify-votes` (N independent skeptics, majority vote), `--hunt-lenses` (failure-mode-specialist generation, deduped), `--hunt-rounds` (loop-until-dry with a completeness critic), `--hunt-budget` (token cap). Honesty guardrails: no CVE assignment, no exploit code, each lead states what to verify.
{{< /feature >}}

{{< feature icon="arrows-maximize" title="Recall mode (verifier-gated)" >}}
`--recall` widens taint discovery — deeper import-hop depth and **capability-reach enumeration** (every place data reaches exec/fs/network/deserialize/template/SQL, pattern or not) — then marks the extra reach **speculative**, keeps it out of the `--fail-on-new-high` gate, and leaves it for `--hunt --verify` to adjudicate. Aggressiveness only pays off behind a verifier.
{{< /feature >}}

{{< feature icon="affiliate" title="Cross-repo / fleet analysis" >}}
`attackmap analyze repoA repoB …` scans a whole fleet, links one repo's outbound HTTP calls to another's routes into a service graph, and surfaces the bugs that live in the **seams**: cross-boundary (confused-deputy) flows, trust-assumption gaps where neither side enforces authz, and the sibling service that omits a control its peers apply. Each repo also gets its own report; cross-repo findings are speculative until verified.
{{< /feature >}}

{{< feature icon="wrench" title="Remediation + PR bot" >}}
`--remediate` proposes review-first fixes for the highest-priority findings. A reusable GitHub **Action + PR bot** runs AttackMap on every pull request — inline SARIF annotations plus a summary comment carrying the exploitability ranking and diff-gate status (new vs. resolved findings).
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
    Plus cross-file passes: taint (TaintChain), SBOM (DependencyHint,
    +Vulnerability with --cve), authz (BolaCandidate), and anomaly (Anomaly).
    Per-file passes add crypto, web-hardening, and novel-vuln weaknesses.

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
    attackmap-report.sarif  (GitHub Code Scanning)
    attackmap-paths.md/.dot  attackmap-topology.md/.dot  (Mermaid + Graphviz)
    (optional) attackmap-diff.md          (with --baseline)
    (optional) defensive-review-llm.md    (with --llm)
```

## Quick start

```bash
pip install "attackmap[all]"      # core + all 14 analyzer plugins

# Analyze the current directory
attackmap analyze .

# Specify output directory
attackmap analyze . --output my-reports

# Cross-reference dependencies against OSV.dev (network, cached)
attackmap analyze . --cve

# Enable LLM prose review (uses claude CLI by default)
attackmap analyze . --llm

# Widen discovery, then adjudicate (verifier-gated recall)
attackmap analyze . --recall --hunt --verify

# Multi-repo fleet scan — links the seams between services
attackmap analyze ./service-a ./service-b ./gateway

# PR gating: diff against a prior report, fail on new HIGH findings
attackmap analyze . --baseline prev/attackmap-report.json --fail-on-new-high

# Recommend the analyzer plugins this repo needs
attackmap suggest .

# List installed and available analyzers
attackmap modules
```

Also available via `brew install mlaify/tap/attackmap` and
`docker pull ghcr.io/mlaify/attackmap`.

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
| `attackmap-report.sarif` | SARIF 2.1.0 | GitHub Code Scanning / VS Code / SARIF consumers |
| `attackmap-paths.md` · `.dot` | Mermaid · Graphviz | Attack-path flowcharts |
| `attackmap-topology.md` · `.dot` | Mermaid · Graphviz | Service-topology graph |
| `attackmap-diff.md` | Markdown | New/Persisted/Resolved diff (`--baseline` only) |
| `attackmap-exploitability.md` | Markdown | "Most exploitable now" — ranked route→sink scores with factors |
| `defensive-review-llm.md` | Markdown | LLM-generated prose review (`--llm` only) |
| `vulnerability-hypotheses.md` | Markdown | LLM exploit-chain hypotheses to confirm, with CONFIRMED/REFUTED verdicts under `--verify` (`--hunt`) |
| `triage.md` | Markdown | Clustered / deduped / ranked shortlist of existing findings (`--triage`) |
| `remediation.md` | Markdown | Review-first fix proposals for top findings (`--remediate` only) |
| `attackmap-pr-comment.md` | Markdown | PR-bot summary comment — new/resolved findings, gate status, top exploitable (`--pr-comment`) |
| `fleet-summary.md` · `.json` | Markdown · JSON | Multi-repo index: per-repo findings + cross-repo links, cross-boundary flows, trust gaps, anomalies (multi-repo runs) |
| `fleet-graph.md` | Mermaid | Repo-to-repo service graph from linked calls (multi-repo runs) |

## What's strong, what's maturing

{{< callout type="note" >}}
**Strong today:** modular analyzer execution with entry-point discovery (14-plugin ecosystem, published to PyPI/Homebrew/GHCR); framework-aware route extraction (FastAPI/Flask/Express/Spring/axum/chi/gin/echo/Laravel/Symfony); chain-aware threat modeling; asset + control modeling; **multi-language** injection/data-flow detection across Python, JS/TS, Go, and PHP (SSRF, SSTI, NoSQL, deserialization, code/command exec, open redirect), with parameterized-SQL, sanitizer, and auth-middleware awareness; novel vuln-class detectors (prototype pollution, mass assignment, JWT, XXE, ReDoS, insecure upload, GraphQL exposure); BOLA/IDOR authorization (path template, query param, RPC method, GraphQL field); insecure-crypto and web-hardening detection; anomaly/outlier plus **signature-free invariant mining**; deterministic exploitability fusion with known-CVE-on-path amplification; a **`--hunt` verify jury** (`--verify-votes`/`--hunt-lenses`/`--hunt-rounds`/`--hunt-budget`) with source adjudication; **`--recall`** verifier-gated aggressive discovery + capability-reach; **`--triage`** clustering/ranking; **cross-repo / fleet analysis** (contract linking, cross-boundary/confused-deputy flows, trust-assumption gaps, cross-repo anomaly); `--remediate` fix proposals; a GitHub Action + PR bot; SBOM + OSV.dev CVE cross-reference (lockfile-resolved when present); finding suppression; SARIF, Mermaid/Graphviz, and PR-diff output; a live progress bar with ETA; stable machine-readable JSON artifacts; local eval harness. Validated against real-world codebases (Bluesky, Juice Shop, BookStack, PocketBase, Apple oss-distributions).

**Still maturing:** the import-graph taint walk approximates call-edges with import-edges — call-graph-aware for Python/JS/TS (edges pruned to used symbols), plain import-graph for Go/PHP (precision over recall, evidence not proof); cross-repo linking today covers HTTP client↔route (richer dimensions — shared schemas, queues, DB tables, token issuer/audience — are planned); all recall and cross-repo findings are **speculative** until the verifier adjudicates them; anomaly and exploitability reasoning is route-cohort and taint-chain scoped. AttackMap is heuristic by design — findings are confidence-tiered evidence, not proof.
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
