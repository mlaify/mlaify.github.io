---
title: "How it works"
description: "One rclone daemon, an NFS server on loopback per connection, and a mount grrclone performs itself, with options that keep Finder responsive when storage goes away."
weight: 10
---

grrclone runs one bundled `rclone` daemon, starts an NFS server on loopback for each
connection, and **performs the mount itself**. Everything else follows from that.

## Why it mounts by hand

`rclone nfsmount` and rclone's `mount/mount` endpoint both hardcode their mount
options. That leaves you with macOS's default **hard, non-interruptible** NFS mount:
when the backend dies, Finder beachballs and processes wedge until you reboot.
grrclone mounts with:

```
soft,intr,timeo=600,retrans=2,nolocks,locallocks,nfc,rsize=131072,wsize=131072
```

With the server killed under a live mount, it gets an error after 7.1 seconds and
recovers cleanly, with no reboot. `nolocks` is there because rclone's NFS server
runs no lock daemon, so anything that takes a file lock (SQLite, Office, Adobe)
would otherwise wait forever for one.

## The parts

The logic lives in Swift packages that build and test without Xcode. The app is a
thin SwiftUI layer on top.

| Part | What it does |
|---|---|
| **RcloneRC** | A client for rclone's remote-control API over a unix socket: serving, config, providers, bandwidth limits, unlocking an encrypted `rclone.conf`, and deadlines for calls that can't be cancelled. |
| **GrrCloneCore** | The connection lifecycle: start the daemon, serve, mount, unmount, reconcile after a crash, and tear down in the one safe order. It keeps the registry of the mounts grrclone made, checks mount health, and stores connections apart from `rclone.conf`. |
| **grrclonectl** | A command-line driver for the same code (`doctor`, `remotes`, `connect`, `mounts`, `recovery-test`), for development and diagnosis. |
| **The app** | The menu bar app, settings and wizards, built on GrrCloneCore. No Dock icon. |

## Safety rules in the code

- **It only unmounts what it mounted.** A mount you made with `rclone nfsmount` looks
  the same as grrclone's in the kernel's mount table. grrclone writes each mount to
  its own registry *before* mounting, and unmounts a path only if that exact path is
  there. Mounts it can see but doesn't own are listed under "Not managed by grrclone".
- **The control channel isn't on the network.** The daemon listens on a unix socket
  with `0600` permissions in a `0700` directory, with random credentials for each
  launch, handed over in a file rather than on the command line.
- **Logs are redacted on the way in.** Authorization headers, cookies, AWS
  signatures, credentials in URLs and the control-socket password are stripped as each
  line arrives, so the secret is never stored.
- **A crash can't leave a trap.** Empty mount points are left unwritable, so a folder
  can't silently swallow files while its volume is missing, and an orphaned daemon
  from an unclean shutdown is found and stopped at the next launch.
- **The privacy promise is a CI check.** Every pull request fails if a telemetry SDK
  appears, a server binds to anything but loopback, update checks become on by
  default, a new outbound host shows up, or App Transport Security is weakened.

## Performance

Against a real WebDAV remote over the internet:

| | `rclone copy` | Through the mount |
|---|---|---|
| Cold read | 15.0 MB/s | 9.2 MB/s |
| Write, end to end | 15.3 MB/s | 11.9 MB/s |
| List 1,000 entries | 1.79 s | 0.64 s |

The method and full numbers are in
[docs/benchmarks.md](https://github.com/mlaify/grrclone/blob/main/docs/benchmarks.md).
What NFSv3 and macOS's NFS client can't do (shared locks, extended attributes) is in
[docs/limitations.md](https://github.com/mlaify/grrclone/blob/main/docs/limitations.md).

## Build it yourself

```bash
brew install xcodegen
swift scripts/make-icon.swift                 # the icon is generated, not committed
iconutil -c icns build/AppIcon.iconset -o App/grrclone/Resources/AppIcon.icns
scripts/fetch-rclone.sh                       # pinned and checksummed
scripts/build-app.sh

swift build && swift test                     # the packages, without Xcode
.build/debug/grrclonectl doctor               # environment check
```

rclone 1.74.4 is the minimum; releases bundle a pinned copy.
