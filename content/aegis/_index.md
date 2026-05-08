---
title: "Aegis"
description: "Aegis is a zero-trust, identity-native, post-quantum end-to-end encrypted messaging protocol — a hardened alternative to email infrastructure with clients for web, iOS, macOS, Android, and CLI."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
accent: "aegis"
---

{{< status "alpha" >}}

## What Aegis is

Aegis is a **zero-trust, identity-native, end-to-end encrypted asynchronous messaging protocol** designed as a post-quantum-resistant alternative to traditional email infrastructure.

Every message is sealed by the sender using the recipient's public key before it ever touches a relay. The relay stores only encrypted envelopes it cannot read. The recipient decrypts locally. The relay is explicitly untrusted by design — compromising it reveals nothing about message content.

**Current version: v0.3.0-alpha** (key lifecycle and one-time prekey forward secrecy, in flight)

{{< callout type="security" >}}
Aegis is in **alpha**. Cryptographic primitives are FIPS-finalized and the core protocol is operational, but the implementation has not undergone a third-party security audit. Do not use it for production workloads where message confidentiality carries legal or safety consequences.
{{< /callout >}}

## Features

{{< feature-grid cols="4" >}}

{{< feature icon="lock" title="Post-quantum hybrid cryptography" >}}
Every message is encrypted with a hybrid scheme combining X25519 ECDH (classical) and ML-KEM-768 (NIST FIPS 203, post-quantum). Security holds if either primitive remains unbroken — hedging against both classical and quantum adversaries.
{{< /feature >}}

{{< feature icon="writing-sign" title="Dual-signature identity" >}}
Every identity carries Ed25519 (classical) and ML-DSA-65 (NIST FIPS 204, post-quantum) signing keys. Envelopes are signed with both. Verification requires both to pass — or the message is rejected.
{{< /feature >}}

{{< feature icon="key" title="One-time prekey forward secrecy" >}}
Senders claim a one-time ML-KEM-768 prekey from the relay for each message. Used once, enforced by the relay atomically, consumed by the recipient on open. Each message has a unique KEM — past sessions stay protected even if long-term keys are compromised.
{{< /feature >}}

{{< feature icon="building-fortress" title="Zero-trust relay" >}}
The relay stores, routes, and federates encrypted envelopes. It cannot decrypt them. It enforces prekey consumption atomicity and audit logging, but has no access to message content, subject, sender identity beyond a hint, or thread structure.
{{< /feature >}}

{{< feature icon="devices" title="Multi-platform clients" >}}
Web (React + Cloudflare Workers), iOS/iPadOS (SwiftUI), macOS (SwiftUI), Android (Kotlin/Compose), and CLI (aegit). All share the same Rust crypto core via aegis-core crates and aegis-ffi UniFFI bindings.
{{< /feature >}}

{{< feature icon="fingerprint" title="Passkey-backed vault" >}}
Client key material is protected by a device-bound passkey (WebAuthn / Face ID / Touch ID / Android BiometricPrompt). The vault key is derived from the passkey challenge — never transmitted, never stored server-side.
{{< /feature >}}

{{< feature icon="mail-forward" title="Legacy gateway" >}}
aegis-gateway bridges AMP traffic to legacy SMTP/IMAP with an explicit downgrade policy. Operators choose: reject delivery to non-AMP recipients, allow with a warning, or require user confirmation. Downgrade is never silent.
{{< /feature >}}

{{< feature icon="server" title="Self-hostable, federated" >}}
Deploy aegis-relay with Docker Compose and a Cloudflare Tunnel in one command. The relay federates with other AMP relays. Operators control retention, auth, and cleanup policy. No vendor lock-in.
{{< /feature >}}

{{< /feature-grid >}}

## The cryptographic suite

**Suite ID:** `AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1`

| Component | Algorithm | Standard | Security level |
|---|---|---|---|
| KEM (classical) | X25519 ECDH | RFC 7748 | 128-bit |
| KEM (post-quantum) | ML-KEM-768 | NIST FIPS 203 | Level 3 (~192-bit) |
| KEM combine | HKDF-SHA-256 | RFC 5869 | — |
| AEAD | XChaCha20-Poly1305 | RFC 7539 + ext | 256-bit key, 24-byte nonce |
| Signature (classical) | Ed25519 | RFC 8032 | 128-bit |
| Signature (post-quantum) | ML-DSA-65 (Dilithium3) | NIST FIPS 204 | Level 3 (~192-bit) |

All implementations are **pure Rust** via the RustCrypto ecosystem — no OpenSSL, no C dependencies.

See [Security model](/aegis/security/) for the full cryptographic construction and threat model.

## The message lifecycle

```
Sender                      Relay                       Recipient
  │                           │                             │
  │  Resolve recipient         │                             │
  │  identity document         │                             │
  │                           │                             │
  │  Claim one-time prekey ───▶│                             │
  │  (ML-KEM-768 public key)  │◀─ Atomically marked claimed │
  │                           │                             │
  │  Encrypt payload:          │                             │
  │   X25519(eph, recipient)  │                             │
  │   ML-KEM-768.Encaps(ek)   │                             │
  │   HKDF(ss₁ ‖ ss₂, nonce) │                             │
  │   XChaCha20-Poly1305       │                             │
  │                           │                             │
  │  Sign envelope:            │                             │
  │   Ed25519 + ML-DSA-65     │                             │
  │                           │                             │
  │  POST /v1/envelopes ──────▶│                             │
  │                           │ Validate prekey             │
  │                           │ Atomically: store envelope  │
  │                           │ + mark prekey consumed      │
  │                           │                             │
  │                           │◀────── GET /v1/envelopes ───│
  │                           │────── { envelopes: [...] }─▶│
  │                           │                             │
  │                           │                  Verify Ed25519 + ML-DSA-65
  │                           │                  X25519(own_sk, eph_pk)
  │                           │                  ML-KEM-768.Decaps(dk, ct)
  │                           │                  HKDF → key → decrypt
  │                           │                  Consume prekey secret locally
  │                           │                  (atomic delete, single-use)
```

## Repository structure

Aegis is a mono-org with 13 repositories, each scoped to a security boundary:

| Repository | Role |
|---|---|
| **aegis-spec** | Protocol truth: RFCs 0001–0006, JSON schemas, conformance matrix |
| **aegis-core** | Shared Rust crates: crypto, protocol types, identity, relay APIs |
| **aegit-cli** | Git-flavored CLI: identity management, seal/open, relay operations |
| **aegis-relay** | Store-and-forward HTTP service: envelope storage, identity directory, prekeys, federation |
| **aegis-gateway** | Legacy SMTP/IMAP bridge with explicit downgrade policy |
| **aegis-web** | Browser SPA: React 18 + Cloudflare Workers |
| **aegis-apple** | SwiftUI iOS/iPadOS/macOS client (shared Swift Package) |
| **aegis-android** | Kotlin/Compose Android client |
| **aegis-ffi** | UniFFI Rust bridge consumed by native clients |
| **aegis-sdk** | Developer SDK: Rust and TypeScript thin wrappers |
| **aegis-admin** | Operator console: relay + gateway management |
| **aegis-deploy** | Docker Compose stack + Cloudflare Tunnel bootstrap |
| **aegis-docs** | Human-facing documentation (tutorials, architecture, roadmap) |

{{< cta url="/aegis/getting-started/" variant="primary" label="Get started with aegit" >}}
{{< cta url="/aegis/security/" variant="ghost" label="Read the security model" >}}
