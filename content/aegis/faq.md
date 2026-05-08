---
title: "Aegis FAQ"
description: "Common questions about Aegis: how it compares to Signal and email, what's open-source, what's stable, how keys work, and when the mobile apps ship."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 40
toc: true
accent: "aegis"
lead: "Common questions answered."
---

## What problem does Aegis solve?

Email was designed in the 1970s with no end-to-end encryption, no cryptographic identity, and no defense against a compromised mail server reading your messages. S/MIME and PGP added encryption as an afterthought, but adoption never reached critical mass because the user experience is terrible.

Aegis redesigns the messaging stack from first principles: identity is cryptographic, encryption is mandatory and post-quantum, the relay is explicitly untrusted, and the protocol is designed so that compromising the infrastructure reveals nothing about message content.

---

## How is Aegis different from Signal?

| | Aegis | Signal |
|---|---|---|
| **Primary use case** | Email replacement (async, store-and-forward) | Instant messaging (push, real-time) |
| **Identity** | Cryptographic DID (`amp:did:key:...`), no phone number required | Phone number tied to identity |
| **Post-quantum** | ML-KEM-768 + ML-DSA-65 (FIPS 203/204), shipped v0.2+ | Post-quantum in progress (PQXDH, not yet FIPS) |
| **Relay trust** | Explicitly untrusted — relay cannot read messages | Signal server is trusted not to be compromised |
| **Self-hostable** | Yes — deploy your own relay with Docker Compose | No official self-hosting path |
| **Legacy interop** | Yes — gateway bridges SMTP/IMAP | No |
| **Clients** | Web, iOS, macOS, Android, CLI | Mobile-first, some desktop |

Signal is an excellent instant messaging app. Aegis is designed for a different threat model and use case.

---

## How is Aegis different from PGP?

PGP encrypts email content but the mental model is hard, key distribution is manual and brittle (key servers, web of trust), and the UX has defeated mainstream adoption for 30 years.

Aegis replaces the entire infrastructure: the identity document is self-describing and relay-hosted, key distribution is automatic (you publish to a relay, senders fetch your keys), and the user experience is designed first. Post-quantum cryptography is built in, not bolted on.

---

## Is Aegis ready for production use?

No. Aegis is in **alpha**. The cryptographic primitives are FIPS-finalized and the protocol is operational, but:

- No third-party security audit has been performed
- Key continuity (rotation tracking) is not yet implemented
- Federation (multi-relay routing) is not yet implemented
- The mobile client apps are in development

Use Aegis for testing, protocol development, and non-sensitive workloads. Do not use it for anything where message confidentiality has legal, medical, or safety implications.

---

## What algorithms does Aegis use?

**Production suite:** `AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1`

| Role | Algorithm | Standard |
|---|---|---|
| Key encapsulation (classical) | X25519 ECDH | RFC 7748 |
| Key encapsulation (post-quantum) | ML-KEM-768 | NIST FIPS 203 |
| KEM combine | HKDF-SHA-256 | RFC 5869 |
| Authenticated encryption | XChaCha20-Poly1305 | RFC 7539 + ext |
| Signature (classical) | Ed25519 | RFC 8032 |
| Signature (post-quantum) | ML-DSA-65 (Dilithium3) | NIST FIPS 204 |

All implementations are pure Rust via RustCrypto. No OpenSSL.

---

## What is a one-time prekey and why does it matter?

A one-time prekey is a single-use ML-KEM-768 encapsulation key that provides per-message forward secrecy.

Without prekeys: every message is encrypted to your long-term ML-KEM-768 public key. If your long-term private key is compromised later, an attacker with a recording of past traffic could decrypt all those messages.

With prekeys: each message uses a unique, single-use ML-KEM-768 key. The relay enforces that each prekey is claimed exactly once (atomic consumption). You delete the private half locally after decrypting. Even if your long-term key is later compromised, past messages encrypted to consumed prekeys cannot be decrypted.

---

## What is a relay and who runs it?

A relay is a store-and-forward HTTP service that:
- Accepts and stores encrypted envelopes on behalf of recipients
- Serves identity documents and manages the prekey pool
- Tracks envelope acknowledgment and cleanup

The relay **cannot** read messages — it only handles ciphertext. You can run your own relay (see [aegis-deploy](https://github.com/mlaify/aegis-deploy)) or use one operated by a trusted party.

---

## What does the gateway do?

The gateway (`aegis-gateway`) bridges AMP traffic to legacy SMTP/IMAP email. It allows Aegis users to exchange messages with people who only have email addresses.

The gateway has an explicit **downgrade policy** — operators configure what happens when a message must be sent via unencrypted SMTP:
- `Reject` — refuse to deliver (maximum security)
- `AllowWithWarning` — deliver, but signal a warning to the sender's client
- `RequireUserConfirmation` — prompt the sender to explicitly approve the security reduction

Downgrade is never silent.

---

## What does the relay see?

The relay sees:
- Encrypted envelope blob (opaque ciphertext it cannot read)
- Recipient identity ID (cryptographic identifier)
- Optional unverified sender hint
- Envelope timestamps (created_at, expires_at)
- Suite ID

The relay does **not** see message content, subject, thread structure, or sender identity.

---

## How do identity IDs work?

An Aegis identity ID has the format `amp:did:key:<identifier>`. It is a cryptographic identifier derived from public key material — not a phone number, email address, or username.

Aliases (`alice@example.com`) are **convenience labels** stored in the identity document and indexed by the relay for easy lookup. They are **not** security roots — trust anchors in the cryptographic `identity_id`, not the alias. Clients should surface the `identity_id` for security-sensitive operations.

---

## Are the private keys ever transmitted?

Never. Private key material is generated on-device and stays on-device. The relay, gateway, and admin panel never see any private key material.

- **CLI:** stored in `~/.aegit/identities/<id>.pq-key.json`
- **iOS / macOS:** stored in the system Keychain (encrypted by the OS)
- **Android:** stored in Android Keystore (hardware-backed where available)
- **Web:** stored in an encrypted IndexedDB vault, locked by a passkey-derived key that never leaves the browser

---

## What is the demo suite and when should I use it?

The demo suite (`AMP-DEMO-XCHACHA20POLY1305`) uses a passphrase-derived key (BLAKE3) instead of hybrid PQ key agreement. It exists for local testing when you don't have a published identity with PQ keys.

**Do not use the demo suite for anything sensitive.** It provides no post-quantum protection, no public-key cryptography, and no signature-based identity verification.

---

## When are the mobile apps shipping?

The iOS, macOS, and Android apps are in active development. They are not yet available on the App Store, Mac App Store, or Google Play. See [Release Notes](/aegis/release-notes/) for the current roadmap.

---

## Is Aegis open-source?

Yes. All repositories in the mlaify/aegis organization are MIT licensed. The protocol specification ([aegis-spec](https://github.com/mlaify/aegis-spec)) is separately documented.

---

## Where do I report a security vulnerability?

See the [Security page](/security/) or the [SECURITY.md](https://github.com/mlaify/aegis-spec/blob/main/SECURITY.md) in the spec repo. Do not open a public GitHub issue for a security vulnerability.

Contact: [matthewd@matthewd.xyz](mailto:matthewd@matthewd.xyz)
