---
title: "Build principles"
description: "The five conventions every project of mine follows: real workflows, explicit status, security as design, composable boundaries, and documentation close to implementation."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-06-03T00:00:00-05:00
draft: false
weight: 20
toc: true
sidebar: false
lead: "The five conventions every project of mine follows."
aliases:
  - /build-principles/
---

These are not aspirational. They are the conventions every project of mine actually follows. If a project on this site appears to violate one of them, it's a bug — file an issue.

## 1. Build practical systems for real operator workflows

I build for the people who actually do the work — curators, security reviewers, hospital contract administrators, students, protocol engineers. Every product decision is judged against "does this make the operator's day better."

This shows up in concrete ways: AttackMap's defensive review is the artifact you hand to a reviewer, not a pile of raw findings, and it runs locally against the repo you already have instead of asking you to change how you work.

## 2. Keep current status and known limits explicit

Every project carries an honest status badge — `alpha`, `beta`, `stable` — that means what it says. Every project page has a "what's not yet hardened" section. Every protocol document separates current guarantees from open work.

Two reasons. First: trust. A project that admits its limits is one you can plan around. Second: it's accurate. Most of these projects *are* in early stages, and pretending otherwise produces brittle adoption that breaks when reality shows up.

## 3. Treat security architecture and threat modeling as core design work

AttackMap's pipeline is shaped around the question "what could an attacker do" rather than "what patterns does the analyzer match." Its threat model and exploitability scoring are the design the code follows, not a report generated after the fact.

When a project lacks an explicit threat model, that's a known gap, not a feature. I track it and say so on the project's page.

## 4. Favor composable, provider-friendly module boundaries

- AttackMap analyzers are independent packages, discovered via Python entry points. Swap one, write your own, run a subset.
- AttackMap treats LLM providers as pluggable — Claude or OpenAI/Codex, API key or subscription CLI, all behind the same interface.

This costs more design effort upfront. The payoff is avoiding the corner where one provider's outage or one analyzer's bug blocks the rest of the system.

## 5. Keep documentation close to implementation

Documentation lives in the repository it documents. Architecture docs, threat models, API references, contributor guides — all alongside the source they describe. When the code changes, the docs change in the same PR.

This site (matthewd.xyz) is not the canonical home of any project's documentation. It is a getting-started layer that links out to the canonical sources. The canonical home for AttackMap analyzer contracts is the `src/attackmap/sdk/` directory in the AttackMap repo.

If something on this site disagrees with a project's repo, **the repo is correct**.

## In practice

You can see all five reflected in AttackMap:

- Its defensive review is a reviewable artifact that runs locally against your repo — Principle 1 (real workflows).
- It carries an explicit `beta` status and a "what's not yet hardened" section — Principle 2 (explicit status).
- Its pipeline is shaped around threat modeling and exploitability, not pattern-matching — Principle 3 (security as design).
- Its analyzers are independent packages and its LLM providers are pluggable — Principle 4 (composable).
- Its `docs/` and analyzer SDK live next to the source — Principle 5.

That's how I know I'm still building the same kind of system.
