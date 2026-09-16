---
title: "Build principles"
description: "The five conventions all my work follows: real workflows, explicit status, security as design, composable boundaries, and documentation close to implementation."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-09-16T00:00:00-05:00
draft: false
weight: 20
toc: true
sidebar: false
lead: "The five conventions all my work follows."
aliases:
  - /build-principles/
---

These are not aspirational. They are the conventions my open source work — AI-driven software and defensive cybersecurity tooling — actually follows.

## 1. Build practical systems for real operator workflows

I build for the people who actually do the work — security reviewers, administrators, analysts, protocol engineers. Every product decision is judged against "does this make the operator's day better."

In practice that means fitting into the systems an operator already runs rather than demanding a new dashboard, a cloud account, or an app store dependency.

## 2. Keep current status and known limits explicit

Everything I ship carries an honest status — `alpha`, `beta`, `stable` — that means what it says, and a "what's not yet hardened" section. Every protocol document separates current guarantees from open work.

Two reasons. First: trust. Something that admits its limits is something you can plan around. Second: it's accurate. Early-stage work *is* early-stage, and pretending otherwise produces brittle adoption that breaks when reality shows up.

## 3. Treat security architecture and threat modeling as core design work

A threat model leads the README: what a tool defends against, and just as prominently, what it does not. That document is the design the code follows, not a report generated after the fact.

Where an explicit threat model is missing, that's a known gap, not a feature. I track it and say so.

## 4. Favor composable, provider-friendly module boundaries

I prefer standard, documented protocols and formats over bespoke servers and proprietary interfaces, so anything compliant interoperates. Alerting, retention, and long-term storage are deliberately left to the tools you already operate rather than reinvented.

This costs more design effort upfront. The payoff is avoiding the corner where one provider's outage or one component's bug blocks the rest of the system.

## 5. Keep documentation close to implementation

Documentation lives in the repository it documents. Architecture docs, threat models, API references, contributor guides — all alongside the source they describe. When the code changes, the docs change in the same PR.

This site (mlaify.io) is not the canonical home of any documentation. It is a getting-started layer that links out to the canonical sources on [GitHub](https://github.com/mlaify).

If something on this site disagrees with a repository, **the repo is correct**.
