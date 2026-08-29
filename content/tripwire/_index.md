---
title: "GrapheneOS Tamper Tripwire"
description: "A small, auditable Android app that records physical-security events and forwards them to a private TLS syslog collector."
date: 2026-08-29T00:00:00-05:00
draft: false
comments: false
---

**GrapheneOS Tamper Tripwire** is a small, auditable Android application that
records selected physical-security events — unlocks, failed unlock attempts,
reboots, and motion while locked — and forwards them to a private TLS syslog
collector you control. It's built for people who want a visible signal when
their device is handled while they're away from it.

The app is intentionally narrow: no analytics, no advertising, no cloud
account, and no access to location, storage, contacts, microphone, camera,
SMS, or accessibility services.

## How it works

When explicitly armed, the app commits events to device-protected local
storage with an `fsync`, then delivers them in order to your collector as
RFC 5424 syslog messages over TLS 1.3 with RFC 6587 octet-counted framing.
If the collector is unreachable, the queue stays on the device and retries.
Any compliant syslog receiver works — there is no bespoke server component.

A few design points:

- The device identifier is a random per-installation UUID, not a hardware identifier.
- Armed monitoring is visible by design — a foreground-service notification, a launcher icon, and Android's own Device Admin disclosure.
- Device Admin requests only `watch-login`; the app cannot wipe, lock, or reset credentials.
- Cleartext network traffic and Android backups are disabled in the manifest.
- No public Internet exposure is required — a private LAN or VPN path to the collector is preferred.

## Honest limits

This is an early security tool, not a guarantee that tampering will always be
detected. It targets casual or opportunistic physical interaction with a
normally operating phone. It does not detect movement while powered off, an
attacker who compromises the OS or the collector, or motion below the
sensor's significant-motion threshold. The repo's README leads with the full
threat model and limitations — read it before relying on the app.

## Status

Alpha. The TLS transport, local queue, arming, foreground service, manual
alert, and successful-unlock event have been exercised on a GrapheneOS
device. Failed-credential, locked-motion, reboot persistence, and
long-duration reliability still need repeatable validation across devices.

## Source

The canonical home for the code, build instructions, threat model, and
documentation is the repository:
[github.com/mlaify/grapheneos-tripwire](https://github.com/mlaify/grapheneos-tripwire)
(MIT licensed).
