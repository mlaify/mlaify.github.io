---
title: "Aegis security model"
description: "What Aegis guarantees today, what it explicitly does not, the full cryptographic construction, and where to find the formal RFCs and threat-model documents."
date: 2026-05-08T00:00:00-05:00
lastmod: 2026-05-08T00:00:00-05:00
draft: false
weight: 30
toc: true
accent: "aegis"
lead: "Honest accounting of Aegis's cryptographic guarantees, threat model boundaries, and known limitations."
---

{{< callout type="security" >}}
Aegis is in **alpha**. The cryptographic primitives are FIPS-finalized and the core protocol is operational. However, the implementation has **not** undergone a third-party security audit. Do not use it for production workloads where message confidentiality has legal or safety consequences.
{{< /callout >}}

## What Aegis guarantees

### End-to-end encryption

Message payloads are encrypted by the sender before they leave the device and decrypted by the recipient after they arrive. No intermediate party — including the relay operator — can read message content, subject, thread structure, or attachment data.

### Post-quantum security (hybrid)

Encryption uses a hybrid construction: X25519 (classical) combined with ML-KEM-768 (NIST FIPS 203, post-quantum). Security holds if **either** primitive remains unbroken. A future quantum computer that breaks X25519 still cannot decrypt messages because ML-KEM-768 remains secure. A break in ML-KEM-768 still cannot decrypt messages because X25519 remains secure.

The same hybrid principle applies to signatures: Ed25519 (classical) combined with ML-DSA-65 (NIST FIPS 204). Both signatures must verify for an envelope to be accepted.

### Forward secrecy via one-time prekeys

When a relay has one-time prekeys for a recipient, each message uses a unique, single-use ML-KEM-768 encapsulation key. The relay enforces atomic consumption (a prekey used once cannot be used again). Recipients delete the private half locally after decryption. Compromise of long-term key material does not expose past messages protected by consumed prekeys.

### Identity authenticity

Every identity document carries the holder's Ed25519 and ML-DSA-65 public keys. All envelopes are signed with both private keys. Recipients verify both signatures before accepting a message. The relay verifies identity document signatures before publishing them.

### Relay is untrusted by design

The relay sees:
- Encrypted envelope blob (opaque ciphertext)
- Recipient identity ID (a cryptographic identifier, not a human name)
- Optional sender hint (not verified — decorative)
- Envelope metadata: created_at, expires_at, suite_id

The relay does **not** see:
- Message content, subject, or thread structure
- Sender's identity (the hint is optional and unverified)
- Plaintext of any field inside the `EncryptedBlob`

---

## Cryptographic construction

### Suite ID

`AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1`

### Encryption (sender sealing)

```
1. Generate ephemeral X25519 keypair: (eph_sk, eph_pk)   [32 bytes each]

2. X25519 key agreement:
   ss_x25519 = X25519(eph_sk, recipient_x25519_pk)

3. ML-KEM-768 encapsulation:
   (mlkem_ct, ss_mlkem) = ML_KEM_768.Encaps(recipient_kyber768_ek)
   [mlkem_ct is 1088 bytes]

4. Hybrid KEM combine:
   key = HKDF-SHA-256(
     ikm  = ss_x25519 ‖ ss_mlkem,
     salt = nonce_24,
     info = "aegis-v2-hybrid-encrypt"
   )

5. Encrypt payload:
   ciphertext = XChaCha20-Poly1305.Encrypt(key, nonce_24, payload_json)
   [nonce_24 is 24 cryptographically random bytes]
```

### Decryption (recipient opening)

```
1. X25519 key agreement:
   ss_x25519 = X25519(own_x25519_sk, eph_pk)

2. ML-KEM-768 decapsulation:
   ss_mlkem = ML_KEM_768.Decaps(own_kyber768_dk, mlkem_ct)

3. Hybrid KEM combine (identical HKDF — same nonce, same info string):
   key = HKDF-SHA-256(ss_x25519 ‖ ss_mlkem, nonce_24, "aegis-v2-hybrid-encrypt")

4. Decrypt:
   payload_json = XChaCha20-Poly1305.Decrypt(key, nonce_24, ciphertext)
```

### Signing (sender)

```
1. Serialize envelope to canonical JSON with:
     outer_signature_b64    = null
     outer_pq_signature_b64 = null

2. Classical signature:
   outer_signature_b64 = base64(Ed25519.Sign(sender_ed25519_sk, canonical_bytes))

3. Post-quantum signature:
   outer_pq_signature_b64 = base64(ML_DSA_65.Sign(sender_ml_dsa_65_sk, canonical_bytes))
```

### Verification (recipient)

```
Both must pass — either failure rejects the envelope:

1. Ed25519.Verify(sender_ed25519_vk, canonical_bytes, outer_signature_b64)
2. ML_DSA_65.Verify(sender_ml_dsa_65_vk, canonical_bytes, outer_pq_signature_b64)
```

### Cryptographic implementation

All primitives are **pure Rust** via the RustCrypto ecosystem:

| Primitive | Crate | Version |
|---|---|---|
| ML-KEM-768 (FIPS 203) | `ml-kem` | v0.3 |
| ML-DSA-65 (FIPS 204) | `ml-dsa` | v0.1.0-rc.9 |
| Ed25519 | `ed25519-dalek` | v2 |
| X25519 | `x25519-dalek` | v2 |
| XChaCha20-Poly1305 | `chacha20poly1305` | v0.10 |
| HKDF-SHA-256 | `hkdf` + `sha2` | v0.12 / v0.10 |
| BLAKE3 | `blake3` | v1 |

No OpenSSL. No C dependencies. No assembly optimizations that introduce side-channel risk via third-party code.

---

## Identity document format

```json
{
  "version": 1,
  "identity_id": "amp:did:key:z6MkJZ1nH5...",
  "aliases": ["alice@example.com"],
  "signing_keys": [
    { "key_id": "sig-ed25519-1",  "algorithm": "AMP-ED25519-V1",  "public_key_b64": "..." },
    { "key_id": "sig-mldsa65-1",  "algorithm": "AMP-MLDSA65-V1",  "public_key_b64": "..." }
  ],
  "encryption_keys": [
    { "key_id": "enc-x25519-1",   "algorithm": "AMP-X25519-V1",   "public_key_b64": "..." },
    { "key_id": "enc-mlkem768-1", "algorithm": "AMP-MLKEM768-V1", "public_key_b64": "..." }
  ],
  "supported_suites": ["AMP-HYBRID-X25519-MLKEM768-ED25519-MLDSA65-V1"],
  "relay_endpoints": ["https://relay.example.com"],
  "signature": "ed25519:<b64>|dilithium3:<b64>"
}
```

The relay validates the signature against the embedded signing keys before storing the document. A relay that accepts an improperly signed identity document is non-conforming per RFC-0002.

---

## Private key material storage

```json
{
  "identity_id": "amp:did:key:...",
  "algorithm": "AMP-HYBRID-PQ-PRIVATE-V1",
  "x25519_private_key_b64":      "<32 bytes, base64>",
  "kyber768_secret_key_b64":     "<64-byte FIPS 203 seed, base64>",
  "ed25519_signing_seed_b64":    "<32 bytes, base64>",
  "dilithium3_secret_key_b64":   "<32-byte FIPS 204 seed, base64>"
}
```

Stored at `~/.aegit/identities/<id>.pq-key.json`. This file is the cryptographic root of your identity — back it up and protect it.

Native clients (iOS, macOS, Android) store private key material in the device keychain (iOS Keychain, Android Keystore). The web client stores it in an encrypted IndexedDB vault, unlocked by a passkey-derived key.

---

## Threat model

### In scope — Aegis defends against

| Threat | Defense |
|---|---|
| Passive relay operator reading messages | End-to-end encryption; relay only sees ciphertext |
| Network eavesdropper capturing envelopes | Same — ciphertext is meaningless without the recipient private key |
| Quantum adversary harvesting traffic for future decryption | Hybrid PQ KEM — ML-KEM-768 ciphertext is quantum-resistant |
| Envelope forgery (fake sender) | Dual-signature verification; Ed25519 + ML-DSA-65 must both pass |
| Prekey replay (reusing a claimed prekey) | Relay enforces atomic consumption; `409 prekey_already_used` on duplicate claim |
| Long-term key compromise exposing past messages | One-time prekey forward secrecy; consumed prekeys are gone |
| Identity document tampering | Relay verifies self-signed identity documents before storing |

### Out of scope — Aegis does not defend against

| Threat | Reason |
|---|---|
| Compromised recipient device | If an attacker controls the recipient's device, they can read decrypted messages |
| Metadata analysis (traffic patterns, timing) | The relay knows recipient IDs and envelope arrival times |
| Sender hint correlation | The sender hint is optional but unauthenticated; a sophisticated relay operator could attempt correlation |
| Active relay manipulation (dropping envelopes) | No reliable delivery guarantee in v0.1–v0.3 |
| Key continuity (detecting key rotation attacks) | Key rotation and continuity tracking are deferred to v0.4+ |
| Full metadata privacy | Envelope metadata (created_at, expires_at, suite_id, recipient_id) is plaintext |
| Downgrade attacks on legacy gateway | The gateway logs and optionally blocks downgrade, but cannot enforce AMP if a recipient has no AMP identity |

---

## Known limitations (v0.3)

{{< callout type="warn" >}}
**Not production ready.** The following limitations are known and documented, not surprises:
{{< /callout >}}

- **No third-party audit.** The implementation has not been reviewed by an external cryptographic auditor. Treat all security guarantees as self-asserted until an audit is published.
- **Key continuity not enforced.** Abrupt key changes in a published identity document are not detected or blocked by clients. A relay operator who can replace an identity document could mount an MitM attack.
- **No FIPS test vector validation.** The ML-KEM-768 and ML-DSA-65 implementations have not been validated against the NIST-published Known Answer Tests. Scheduled for v1.0.
- **Alias trust.** Aliases are convenience labels, not security roots. Trust anchors in the cryptographic `identity_id`, not an alias string.
- **No rate limiting.** The relay has no built-in rate limiting. Operators must enforce it at the infrastructure layer.
- **Federation deferred.** Multi-relay delivery and routing are designed but not yet implemented.

---

## Formal specifications

The AMP protocol is specified in six RFCs in [aegis-spec](https://github.com/mlaify/aegis-spec):

| RFC | Title | Status |
|---|---|---|
| RFC-0001 | Protocol Overview and Threat Model | Draft |
| RFC-0002 | Identity Documents and Key Format | Draft |
| RFC-0003 | Cryptographic Suite Definitions | Draft |
| RFC-0004 | Relay API and Envelope Lifecycle | Draft |
| RFC-0005 | Prekey Management and Forward Secrecy | Draft |
| RFC-0006 | Gateway and Downgrade Policy | Draft |

---

## Reporting vulnerabilities

Security issues should be reported per the [vulnerability disclosure policy](/security/). Do not open a public GitHub issue for a security vulnerability.

Contact: [security@matthewd.xyz](mailto:security@matthewd.xyz) · [security@mlaify.io](mailto:security@mlaify.io)
PGP: [matthewd.xyz/matthewdxyz.asc](https://matthewd.xyz/matthewdxyz.asc)
