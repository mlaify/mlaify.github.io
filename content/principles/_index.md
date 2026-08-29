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

This shows up in concrete ways: Tamper Tripwire forwards events to whatever RFC 5424 syslog collector you already run — a private LAN or VPN box you control — instead of shipping its own dashboard, cloud account, or app store dependency.

## 2. Keep current status and known limits explicit

Every project carries an honest status badge — `alpha`, `beta`, `stable` — that means what it says. Every project page has a "what's not yet hardened" section. Every protocol document separates current guarantees from open work.

Two reasons. First: trust. A project that admits its limits is one you can plan around. Second: it's accurate. Most of these projects *are* in early stages, and pretending otherwise produces brittle adoption that breaks when reality shows up.

## 3. Treat security architecture and threat modeling as core design work

Tamper Tripwire's README leads with its threat model — what it detects, and just as prominently, what it does not: movement while powered off, an attacker who compromises the OS, motion below the sensor's threshold. That document is the design the code follows, not a report generated after the fact.

When a project lacks an explicit threat model, that's a known gap, not a feature. I track it and say so on the project's page.

## 4. Favor composable, provider-friendly module boundaries

- Tamper Tripwire speaks standard RFC 5424 syslog with RFC 6587 framing over TLS 1.3 — any compliant collector works, and there is no bespoke server component to run or trust.
- The collector side is yours: alerting, retention, and integrity witnessing are deliberately left to tools you already operate, not reinvented in the app.

This costs more design effort upfront. The payoff is avoiding the corner where one provider's outage or one analyzer's bug blocks the rest of the system.

## 5. Keep documentation close to implementation

Documentation lives in the repository it documents. Architecture docs, threat models, API references, contributor guides — all alongside the source they describe. When the code changes, the docs change in the same PR.

This site (mlaify.io) is not the canonical home of any project's documentation. It is a getting-started layer that links out to the canonical sources. The canonical home for Tamper Tripwire's threat model, build instructions, and security design is the [grapheneos-tripwire](https://github.com/mlaify/grapheneos-tripwire) repo.

If something on this site disagrees with a project's repo, **the repo is correct**.

## In practice

You can see all five reflected in Tamper Tripwire:

- It sends events to the private syslog collector you already run, over a LAN or VPN path you control — Principle 1 (real workflows).
- It carries an explicit `alpha` status and its README says exactly which event paths still need validation — Principle 2 (explicit status).
- Its threat model and limitations lead the README, and the permission surface is deliberately minimal — Principle 3 (security as design).
- It speaks standard RFC 5424/6587 syslog over TLS, so any compliant collector works — Principle 4 (composable).
- Its threat model, build docs, and security policy live in the repo next to the source — Principle 5.

That's how I know I'm still building the same kind of system.
