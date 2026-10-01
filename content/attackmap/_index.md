---
title: "AttackMap"
description: "Local-first, AI-assisted defensive security analysis for codebases — maps the attack surface, traces request-to-sink data flow, and produces a prioritized, evidence-grounded review."
lead: "Local-first, AI-assisted defensive security analysis for codebases."
draft: false
comments: false
---

{{< status "help" "Looking for help" >}} {{< status "beta" >}}

AttackMap reads a repository — or a whole fleet of them — the way an attacker
would. It reconstructs the attack surface (routes, data stores, external calls,
auth signals, trust boundaries), traces request-to-sink data flow, scores
exploitability, and writes an evidence-grounded, prioritized security review. It
finds the cross-cutting weaknesses single-file scanners miss.

Everything runs on your machine. Nothing is uploaded unless you explicitly turn on
an LLM backend, and the output is aimed entirely at remediation: no exploit code,
no offensive payloads.

{{< cta url="https://docs.mlaify.io" variant="primary" label="Read the docs" >}}
{{< cta url="https://github.com/mlaify/AttackMap" variant="ghost" label="View on GitHub" >}}

![The AttackMap macOS app after scanning OWASP Juice Shop: 29 findings, 22 exploitable sinks, and the most exploitable route-to-sink path ranked first](/images/attackmap/overview.png)

{{< callout type="note" title="Looking for contributors and co-maintainers" >}}
AttackMap is under active development, but progress may be slow until more help
or co-maintainers join. If you'd like to help with the core
engine, an analyzer, the macOS app, or the docs,
[open an issue](https://github.com/mlaify/AttackMap/issues) to say hello. Security
reports are welcome at [security@mlaify.io](mailto:security@mlaify.io).
{{< /callout >}}

## What it finds

{{< feature-grid cols="3" >}}

{{< feature icon="radar" title="Attack-surface recon" >}}
Routes, data stores, external calls, auth signals, secrets, frameworks, and entry points. Every signal carries a `file:line` citation, an evidence snippet, and a confidence level.
{{< /feature >}}

{{< feature icon="route" title="Data-flow and injection taint" >}}
Python, JS/TS, Go, and PHP: SSRF, SSTI, NoSQL, unsafe deserialization, eval/exec/shell, SQL, and open redirect. Sanitizer-aware, so a chain through a known escaper or validator is downgraded instead of firing.
{{< /feature >}}

{{< feature icon="flame" title="Exploitability scoring" >}}
A deterministic, fully explainable 0–100 "exploitable now" score that fuses sink danger, exposure, route auth, reachability, data sensitivity, and known CVEs on the path.
{{< /feature >}}

{{< feature icon="bug" title="Beyond the taint families" >}}
Prototype pollution, mass assignment, JWT weakness, XXE, ReDoS, insecure upload, GraphQL exposure, BOLA/IDOR authorization, insecure crypto, and web-hardening misconfigurations.
{{< /feature >}}

{{< feature icon="zoom-exclamation" title="Anomaly and invariant mining" >}}
The odd one out among sibling routes, plus signature-free invariant mining: a handler that reaches a dangerous sink without the guard its peers apply.
{{< /feature >}}

{{< feature icon="package" title="Dependency CVEs" >}}
`--cve` builds an SBOM, resolves lockfiles, and cross-references OSV.dev, folding known-vulnerable packages into the exploitability ranking.
{{< /feature >}}

{{< feature icon="sparkles" title="AI review and a verify jury" >}}
`--llm` writes a narrative defensive review with Claude or OpenAI. `--hunt --verify` proposes evidence-cited exploit-chain hypotheses and adjudicates each against the cited source, scaling into a majority-vote jury.
{{< /feature >}}

{{< feature icon="affiliate" title="Cross-repo fleet analysis" >}}
`attackmap analyze repoA repoB …` links one service's outbound calls to another's routes and surfaces the bugs in the seams: confused-deputy flows, trust-assumption gaps, and the sibling that omits a control its peers enforce.
{{< /feature >}}

{{< feature icon="git-branch" title="Built for CI" >}}
SARIF 2.1.0, Mermaid and Graphviz diagrams, baseline diff gating with `--fail-on-new-high`, `--triage`, `--remediate`, finding suppression, and a GitHub Action with a PR bot.
{{< /feature >}}

{{< /feature-grid >}}

## Get started

AttackMap needs Python 3.11 or later and installs straight from GitHub:

```bash
pipx install git+https://github.com/mlaify/AttackMap.git
```

Or install the core plus every official analyzer plugin, and run your first scan:

```bash
pip install "attackmap[all] @ git+https://github.com/mlaify/AttackMap.git"
attackmap analyze /path/to/repo --output reports
```

A few common runs:

```bash
attackmap analyze <path> --cve            # dependency CVEs (OSV.dev)
attackmap analyze <path> --llm            # AI narrative (--llm-provider claude|openai)
attackmap analyze <path> --hunt --verify  # exploit-hypothesis hunt, adjudicated against source
attackmap analyze <path> --baseline prev.json --fail-on-new-high   # PR gate
attackmap analyze ./svc-a ./svc-b ./gw    # cross-repo fleet scan
attackmap suggest ./repo                  # recommend analyzer plugins
```

Start with `reports/defensive-review.md`. Every run also writes JSON
(`attackmap-report.json`), SARIF, and diagram artifacts. The
[quickstart](https://docs.mlaify.io/quickstart/), [CLI reference](https://docs.mlaify.io/cli/),
and [outputs reference](https://docs.mlaify.io/scanning/) cover the rest.

## Supported ecosystems

Fourteen analyzer plugins, each installable on its own (`[all]` installs every one):
**Python**, **JavaScript/TypeScript** (Node services), **Go**, **Java/Kotlin**
(Spring), **C#** (ASP.NET Core), **Rust**, **PHP** (web, Laminas, Omeka-S), **C**,
**C++**, **Terraform**, **IaC** (Docker, Compose, GitHub Actions), and the
**AT Protocol**. A Swift analyzer is an early scaffold. To cover something else, write
your own against the [analyzer SDK](https://docs.mlaify.io/sdk/).

## The macOS app

A native macOS front end drives the same CLI and renders every result view —
overview, findings, exploitability, attack surface, attack-path diagrams, and the
review — with watch mode and fleet scans. Build it from source at
[mlaify/AttackMap-mac](https://github.com/mlaify/AttackMap-mac); the
[macOS app guide](https://docs.mlaify.io/gui/) walks through it.

![The AttackMap macOS app ranking route-to-sink paths by exploitability](/images/attackmap/exploitability.png)

## What AttackMap is not

- **Not a runtime detector.** It's static analysis; its detection hints are leads for your SIEM team, not deployable rules.
- **Not a replacement for dedicated SCA.** `--cve` folds CVE signal into an architecture-aware narrative; Trivy, Grype, and Dependabot go deeper on resolution.
- **Not a sound taint engine.** The data-flow pass is a call-graph-refined import-graph walk that favors precision over recall. Findings are evidence, not proof.
- **Not exhaustive.** It's heuristic by design, with explicit confidence tiers. Treat it as a strong lead generator and reviewer aid, not a substitute for manual review.

## Links

- [docs.mlaify.io](https://docs.mlaify.io) — install, quickstart, CLI, AI review, CI, the macOS app, and the SDK
- [mlaify/AttackMap](https://github.com/mlaify/AttackMap) — the core engine (MIT)
- [Analyzer plugins](https://github.com/orgs/mlaify/repositories?q=attackmap-analyzer) — one repo per ecosystem
- [mlaify/AttackMap-mac](https://github.com/mlaify/AttackMap-mac) — the macOS app
- [Road to 1.0](https://github.com/mlaify/AttackMap/issues/209) · [Contributing](https://github.com/mlaify/AttackMap/blob/main/CONTRIBUTING.md) · [Security policy](https://github.com/mlaify/AttackMap/blob/main/SECURITY.md)
