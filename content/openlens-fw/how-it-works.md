---
title: "How it works"
description: "The stock kernel with a new userland: our own video pipeline over the SigmaStar drivers, six small programs, a monitor/worker split, per-camera TLS and updates signed with your own key."
weight: 10
---

openlens-fw keeps the camera's stock bootloader and Linux 5.10 kernel, and replaces everything
in the `rootfs` flash partition: six small programs of our own and Dropbear on BusyBox, where the
stock firmware ran a large vendor media server and a set of management daemons.

## What stays, and what is ours

| From the camera | Ours |
|---|---|
| U-Boot and the kernel (never written) | the root filesystem, its boot scripts and its users |
| the SigmaStar video driver and the sensor driver | `rtspd`: the video pipeline, RTSP, day/night, image controls |
| the ISP tuning files | `camhttpd`: ONVIF, the web UI, snapshots, the claim |
| | `camtls`: TLS for HTTPS and RTSPS |
| | `camcfg`: settings, users, keys, backups |
| | `ntpc`: the NTP client |
| | `camupdate`: signed updates |
| | Dropbear, built from Debian's source, for SSH |

The vendor files the image needs are listed with their SHA-256 hashes; the build copies them from
your own camera's firmware and stops if any differs.

## Video without the vendor's media server

The stock firmware's video ran inside one large proprietary program. `rtspd` instead talks to the
SigmaStar kernel driver directly, with the same ioctls: it sets up the sensor, the image signal
processor, the scaler and the hardware encoder, runs its own auto-exposure and white balance, and
serves the encoded streams over RTSP. Day/night switching follows an exposure score and drives the
IR-cut filter and IR LEDs.

## Security design

**No shared credentials.** A release image holds no account, password, hash or key; the build
scans for them and fails if it finds one. Each camera is *claimed* after the install: for 30
minutes after power-on, an unclaimed camera serves only its setup page, where you create the
first admin and get a one-time recovery code. Until then nothing streams and SSH stays off.

**Nothing that parses the network runs as root.**

| Program | Runs as |
|---|---|
| `rtspd` | its own user |
| `ntpc` | its own user, keeping only the right to set the clock |
| `camhttpd` worker | its own user: parses HTTP and ONVIF, never holds a password |
| `camtls` | its own user: terminates TLS, holds no passwords |
| `camhttpd` monitor | root: checks logins and runs the few privileged actions |

The worker can ask the monitor for a privileged action (save a setting, change a user, set the
clock, install firmware) only inside a verified request from a user with the right role. A bug in
the HTTP or ONVIF parsers doesn't hand over passwords or root.

**A certificate authority per camera.** At first start each camera makes its own CA, with name
constraints that limit it to the camera subnet the image was built for, no IPv6 and no DNS names.
So even a stolen camera CA can't vouch for a website. TLS 1.2 and 1.3 only, ECDHE-ECDSA, no RSA
or CBC. The keys never leave the camera.

**Updates only you can sign.** You make the signing keys (Ed25519, or Ed25519 on a FIDO2
security key) and build the public half into your image. The camera checks the signature, the
device, the image's hash and size, and that the version is newer, before it writes anything, and
an update writes only the `rootfs` partition.

**If the data partition fails,** the camera locks rather than looking new: nobody can claim it,
nothing streams, and only your update keys can get it back, by restoring an encrypted backup or
erasing the settings.

## On the network

| Port | Service |
|---|---|
| 22/tcp | SSH, keys only, post-quantum key exchange (after the claim) |
| 80/tcp | ONVIF and snapshots for NVRs; browsers are sent to HTTPS |
| 443/tcp | HTTPS: web UI, ONVIF |
| 554/tcp | RTSP |
| 322/tcp | RTSPS |
| 3702/udp | WS-Discovery |

The stock kernel has no packet filter, so this list is the whole attack surface. Outbound, the
camera needs only DHCP, DNS and NTP.

## More

The [documentation](https://docs.mlaify.io/openlens-fw/) covers building, signing, installing,
claiming and every setting; the [security model](https://docs.mlaify.io/openlens-fw/security-model/)
has the full design and the known limits.
