---
title: "Build principles"
description: "The five conventions every mlaify project follows: real workflows, explicit status, security as design, composable boundaries, and documentation close to implementation."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 20
toc: true
sidebar: false
lead: "The five conventions every mlaify project follows."
---

These are not aspirational. They are the things every mlaify project actually does. If a project on this site appears to violate one of them, it's a bug — file an issue.

## 1. Build practical systems for real operator workflows

We build for the people who actually do the work — curators, security reviewers, hospital contract administrators, students, protocol engineers. Every product decision is judged against "does this make the operator's day better."

This shows up in concrete ways: OmekaRapper integrates into the existing Omeka admin flow rather than adding a separate dashboard. AttackMap's defensive review is the artifact you hand to a reviewer, not a pile of raw findings. Aegis identity recovery does not require server-side state or memorized seed phrases.

## 2. Keep current status and known limits explicit

Every project carries an honest status badge — `alpha`, `beta`, `stable` — that means what it says. Every project page has a "what's not yet hardened" section. Every protocol document separates current guarantees from open work.

Two reasons. First: trust. A project that admits its limits is one you can plan around. Second: it's accurate. Most of our projects *are* in early stages, and pretending otherwise produces brittle adoption that breaks when reality shows up.

## 3. Treat security architecture and threat modeling as core design work

Aegis ships an [`aegis-spec`](https://github.com/mlaify/aegis-spec) repo of normative protocol RFCs. It is not a compliance artifact written after the code shipped — it is the design document the code follows. AttackMap's pipeline is shaped around the question "what could an attacker do" rather than "what patterns can we match."

When a project lacks an explicit threat model, that's a known gap, not a feature. We track it and we say so on the project's page.

## 4. Favor composable, provider-friendly module boundaries

- AttackMap analyzers are independent packages, discovered via Python entry points. Swap one, write your own, run a subset.
- Aegis relays are federated. No central operator. Anyone can run one, and clients can talk across providers.
- OmekaRapper and OpenSift treat AI providers as pluggable. Claude, OpenAI, Codex, local Ollama — all swap behind the same interface.
- OpenContractRx splits API, worker, and web into separate apps so each can scale and evolve independently.

This costs more design effort upfront. The payoff is that we never paint ourselves into a corner where one provider's outage or one analyzer's bug blocks the rest of the system.

## 5. Keep documentation close to implementation

Documentation lives in the repository it documents. Architecture docs, threat models, API references, contributor guides — all alongside the source they describe. When the code changes, the docs change in the same PR.

This site (mlaify.io) is not the canonical home of any project's documentation. It is a marketing and getting-started layer that links out to the canonical sources. The canonical home for Aegis protocol details is `aegis-spec`. The canonical home for AttackMap analyzer contracts is the `src/attackmap/sdk/` directory in the AttackMap repo.

If something on this site disagrees with a project's repo, **the repo is correct**.

## In practice

You can see each principle reflected in a different project:

- **OmekaRapper** emphasizes reviewable AI suggestions before write-back — Principle 1 (real workflows).
- **OpenSift** emphasizes local-first retrieval and explicit hardening notes — Principle 2 (explicit status).
- **Aegis** treats protocol and threat-model docs as first-class artifacts — Principle 3 (security as design).
- **AttackMap** ships analyzers as independent packages — Principle 4 (composable).
- **OpenContractRx** separates API, worker, and web layers — Principle 4, again.
- Every project's `docs/` lives next to its source — Principle 5.

These are how we know we're still building the same kinds of systems. When we drop one, we drop the principle that supported it.
