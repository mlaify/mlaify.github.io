---
title: "Changelog"
description: "What changed in each release, from mlaify/grrclone's CHANGELOG.md at v0.9.5."
weight: 30
release: "v0.9.5"
---

{{< callout type="note" >}}
From [CHANGELOG.md](https://github.com/mlaify/grrclone/blob/v0.9.5/CHANGELOG.md) at
[v0.9.5](https://github.com/mlaify/grrclone/releases/tag/v0.9.5), the latest release. Changes on
`main` since then are in the [repository](https://github.com/mlaify/grrclone/blob/main/CHANGELOG.md).
{{< /callout >}}


All notable changes to grrclone are recorded here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
grrclone uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries describe what changed for a person using the app. The longer reasoning — why a
thing was built the way it was, and what was tried and rejected — lives in
[docs/progress.md](https://github.com/mlaify/grrclone/blob/v0.9.5/docs/progress.md).

## [Unreleased]

## [0.9.5] - 2026-10-01

### Added

- grrclone now keeps a record of why it rebuilt a volume, left a slow one alone,
  or reported one as failed, and of each time you connected or disconnected one.
  Each line says what triggered the check (the timer, waking from sleep, a network
  change, rclone stopping, or Check mounts), what each probe found and how long it
  took, and how many uploads were in flight. It is kept in
  `~/Library/Logs/org.mlaify.grrclone/health.log`, survives quitting the app, and
  the latest entries are under Health decisions on the Logs tab. Healthy checks
  are not written.
  ([#154](https://github.com/mlaify/grrclone/issues/154))

### Documentation

- The README and docs/limitations.md now explain macOS's "Server connections
  interrupted" alert: it appears after five seconds of silence, Ignore is safe,
  what Disconnect All does, and how to find the cause.
  ([#155](https://github.com/mlaify/grrclone/issues/155))

### Fixed

- When checking whether rclone from a previous run is still alive, grrclone no longer

  treats "could not read that process's details" as "that process is not rclone".
  The second reading cleared the record of a daemon that might still be running and
  left it unreachable. It now waits and asks again, and if it still cannot tell,
  starts nothing and says so.
  ([#149](https://github.com/mlaify/grrclone/issues/149))

- grrclone no longer asks a remote about its storage usage unless that remote is
  connected. Opening the menu used to ask every configured remote, which made
  rclone log in to providers you had set up but never connected from this Mac.
  Settings now says "Connect to see usage" for those, and the figure is fetched
  as soon as the volume connects. After you edit a connected remote's settings,
  usage waits for the remount rather than contacting the newly entered storage.
  ([#147](https://github.com/mlaify/grrclone/issues/147))

## [0.9.4] - 2026-09-30

### Security

- No password appears in grrclone's process arguments any more. macOS lets every
  account on a Mac read every other account's process arguments, and they also end
  up in crash reports and diagnostic bundles. The built-in rclone's control-socket
  password was passed that way for as long as the app ran; it now goes in a file
  only your account can read, holding a hash, removed when rclone stops. The
  storage-usage check briefly did the same with your WebDAV password, through
  `rclone reveal`; grrclone now reads that value itself without starting a process.
  ([#156](https://github.com/mlaify/grrclone/issues/156))

## [0.9.3] - 2026-09-23

### Fixed

- A volume that is slow to answer is no longer treated as dead. Since 0.9.0 a
  single lookup that took longer than five seconds was enough to disconnect and
  rebuild the volume, which cancelled whatever was uploading at the time and
  raised macOS's "server not responding" prompt for a volume that was fine. A
  slow answer is now only reported; a rebuild needs a second silence of
  forty-five seconds, and never happens while an upload is in flight. The
  background check also runs every five minutes rather than every ninety
  seconds. When rclone itself has stopped, the volumes are rebuilt at once
  without that second wait, and the "responding slowly" status clears when
  the next check finds the volume fine.
  ([#146](https://github.com/mlaify/grrclone/issues/146))

## [0.9.2] - 2026-09-22

### Fixed

- Storage usage no longer reports "could not reveal the stored credential" for the
  roughly one remote in seventy whose stored password happens to begin with a dash.
- Helper commands grrclone runs — mounting, unmounting, `ps`, `nfsstat`, `rclone
  obscure` — no longer occasionally hang until their timeout for no reason. The wait
  for a command to finish was made in a way that could miss the finish; it now cannot.
  This is very likely what produced the occasional "could not tell whether the old
  process is running" refusal at launch.

## [0.9.1] - 2026-09-22

### Added

- The menu shows, under each connection, what the storage reports about its own
  usage — one thin bar per capped pool, `1,003 GiB of 2 TiB`, orange near a limit — and
  the connection's settings show the full picture with soft limits and grace. The data is
  what rclone's `about` returns for any backend that has it, or — for servers that
  publish one — a small usage document at `<url>/.usage/usage.json`, fetched with
  the remote's own credentials and showing one bar per limited pool (files, photos,
  …) with soft and hard limits and grace. Storage that reports nothing says so;
  storage that could not be asked says that instead of showing zero. The document
  format is described in `docs/usage-json.md`. Asked on demand, never polled.

## [0.9.0] - 2026-09-21

### Fixed

- Adding a remote with the name of one that already exists is refused, in the
  wizard before Add is enabled and again underneath it. rclone replaces the
  existing remote's settings and credentials in that case, and used to do so
  without a word. The configuration is now also backed up alongside itself before
  a remote is added, as it already was before one is deleted.
  ([#110](https://github.com/mlaify/grrclone/issues/110))
- Adding a remote no longer writes every advanced setting's default into the
  configuration as if it had been chosen. Only values that differ from rclone's own
  defaults are saved, so a later rclone can still change the ones nobody touched.
  ([#120](https://github.com/mlaify/grrclone/issues/120))
- grrclone now notices at once when the rclone process stops unexpectedly and
  reconnects every volume, instead of leaving them pointing at nothing until the
  Mac next woke from sleep, the network changed, or someone clicked Check mounts.
  A volume whose server is alive but stuck is caught by a check that now also runs
  every ninety seconds while anything is connected.
  ([#119](https://github.com/mlaify/grrclone/issues/119))

## [0.8.0] - 2026-09-21

### Added

- The menu now offers to disconnect a volume that grrclone did not record making
  but that carries grrclone's exact mount options and sits inside the mount
  folder — the leftovers an earlier version made before it kept records, which
  otherwise take `umount -f` once per layer by hand. It is an offer behind a
  confirmation whose default is Cancel; a volume with different options, or
  outside the mount folder, gets no button, and nothing is ever stopped or
  removed alongside it. ([#105](https://github.com/mlaify/grrclone/issues/105))

### Changed

- The bundled rclone is now Apple Silicon only, like the app that ships it. The
  previous universal binary carried an Intel slice nothing could run, and the download
  is smaller for it. ([#122](https://github.com/mlaify/grrclone/issues/122))

### Fixed

- A volume from a previous session that grrclone could not disconnect at launch is
  now named in the menu, with the command that clears it, and is not connected at
  login until it is. It used to go unmentioned. A launch that fails part-way — an
  old background process it cannot identify, a volume it cannot clear — also no
  longer erases the record of what the previous session had mounted, which the
  next launch needs to find files written into a mount point while nothing was
  mounted there. ([#117](https://github.com/mlaify/grrclone/issues/117))
- Launch no longer freezes while grrclone checks the folders a crashed session had
  mounted. Those are the folders most likely to still be a dead volume, and looking
  inside one could hang the app for minutes. A folder that is still mounted is now
  left alone, the rest are checked with a time limit, and one that does not answer is
  reported as unchecked rather than assumed fine. Encrypting the configuration is
  bounded the same way. ([#118](https://github.com/mlaify/grrclone/issues/118))
- Two connections can no longer share a name. The name is also the mount folder, and
  connecting a second connection named like a mounted one used to take over the
  first's ownership record and then forget it, leaving a live volume nothing would
  disconnect. Settings now refuses the duplicate and says which connection has the
  name. ([#112](https://github.com/mlaify/grrclone/issues/112))
- A damaged list of connections is no longer silently replaced. It used to be read as
  empty, after which every remote was set up again with default settings and the
  file overwritten — every mount name, folder and read-only choice gone without a
  word. The unreadable file is now moved aside and named in the menu, so it can be
  restored. ([#113](https://github.com/mlaify/grrclone/issues/113))
- A change to a connection that could not be saved no longer looks saved. The list
  in memory now changes only after the file on disk has, and a refused save is
  reported in the menu. ([#121](https://github.com/mlaify/grrclone/issues/121))
- Clearing or deleting a connection to a whole remote no longer deletes the cache of
  a connected folder of that same remote. rclone keeps a folder's cache inside the
  remote's, and grrclone compared the two by name and saw no relation. Both actions
  now refuse while an overlapping connection is mounted, and say which one. Deleting
  a remote also removes the other connections that used it, which would otherwise
  have stayed in the list pointing at nothing.
  ([#114](https://github.com/mlaify/grrclone/issues/114))
- Disconnecting now checks the list of mounted volumes afterwards rather than trusting
  the unmount command's exit status, which lies in both directions on a path with
  several volumes stacked on it. A layer removed with another still under it is
  reported as exactly that, and the connection stays marked as connected and owned
  until the path is really clear. ([#116](https://github.com/mlaify/grrclone/issues/116))
- A volume that could not be disconnected during a repair after sleep or a network
  change is no longer forgotten. It used to drop out of grrclone's own records while
  still mounted, after which nothing would ever clean it up and the menu called it
  "Not managed by grrclone". ([#111](https://github.com/mlaify/grrclone/issues/111))
- grrclone no longer mounts on top of a volume that is already mounted at the same
  path. It refused only when it could see files there, so a dead mount whose listing
  failed, or an empty one, got a new volume stacked on it — once per retry — which is
  how three copies ended up on one folder. A mounted path is now refused outright,
  before anything is listed. ([#108](https://github.com/mlaify/grrclone/issues/108))
- A failure to read the list of mounted volumes is no longer treated as "nothing is
  mounted". Read that way, it made grrclone forget every volume it owned and then
  stop a leftover background process while those volumes were still up. It now
  refuses to mount, to repair, or to stop anything until it can see the list.
  ([#115](https://github.com/mlaify/grrclone/issues/115))
- The log viewer no longer shows a remote's password in clear text at the Debug
  level. rclone traces every control call there, including the one that creates or
  edits a remote, and the trace carried the password under a key the redaction did
  not know. Every `config/*` call's payload is now removed before it is stored, so
  the tab's promise that passwords are removed automatically is true again.
  ([#109](https://github.com/mlaify/grrclone/issues/109))

## [0.7.1] - 2026-09-19

### Fixed

- The menu now shows the `umount -f` command next to a path that is mounted several
  times over, where it stays visible. It had been placed at the end of the error
  message, which is cut off at three lines — so the one line that said what to do was
  the one nobody could see. The message also now recommends `umount -f` rather than
  `diskutil`, which refuses stacked mounts.
- A freshly upgraded copy no longer quits itself when launched while the previous
  copy is still disconnecting. It used to refuse on sight, and a quit can take minutes
  when uploads are draining — so "the new version is broken" was really "it gave up
  too early". It now waits, bounded, and only refuses if the old copy never exits.
- When a mount point cannot be used because something is *already mounted* there,
  grrclone now says so and how to disconnect it, instead of counting that volume's
  files and telling you to move them. The menu also shows one line per path with
  a count when the same path is mounted several times over, rather than repeating it.

### Documented

- What to do about a mount that is stacked on top of a dead one, and why `umount -f`
  saying "Operation timed out" does not mean it did nothing.

## [0.7.0] - 2026-09-19

### Added

- **grrclone now tells you when an update exists**, instead of waiting to be asked.
  With update checks on it asks GitHub once a day rather than only at launch — a menu
  bar app can run for weeks, so the old behaviour meant anyone who started it before a
  release never heard about it. An available update marks the menu bar icon, and a
  **Copy Command** button puts the upgrade command on your clipboard.
- The upgrade command grrclone shows and copies now refreshes Homebrew first
  (`brew update && brew upgrade --cask grrclone`). `brew upgrade` only refreshes on
  its own once every 24 hours, so anyone who had used brew earlier the same day
  would have been told they were up to date while grrclone said otherwise.
- **One permission, asked once.** Turning on update checks asks macOS whether
  grrclone may notify you. It is the only permission grrclone requests, it is asked
  when you opt in rather than at first launch, and declining costs nothing else — the
  check still runs and the icon still marks the update. The same version is never
  announced twice.
- Releases now carry a **Sigstore-signed build provenance attestation**, logged to a
  public transparency log. Anyone can verify which commit and workflow produced a
  given download with `gh attestation verify grrclone.dmg --repo mlaify/grrclone` —
  a different guarantee from Apple notarisation, and one a stolen signing
  certificate would not defeat.

## [0.6.1] - 2026-09-19

### Fixed

- grrclone no longer starts a second background process when it cannot tell whether
  one from a previous session is still running. It used to treat "could not check"
  as "nothing there", which could leave the old process running and unreachable,
  still serving your volumes with nothing able to stop it.

## [0.6.0] - 2026-09-19

### Added

- **Edit an existing remote** from its page in Settings — a rotated key or a changed
  password no longer means deleting the connection and building it again. Password
  fields start empty and change only if you type a new one; grrclone does not know
  your existing password and does not pretend to.
  ([#83](https://github.com/mlaify/grrclone/issues/83))
- **Transfer progress in the menu** — what is uploading, how far along, how fast, and
  how long is left, instead of only a count.
  ([#81](https://github.com/mlaify/grrclone/issues/81))
- **Mount one folder of a remote** instead of all of it, from the connection's page in
  Settings. Leave it empty for the whole remote.
  ([#82](https://github.com/mlaify/grrclone/issues/82))
- **A Cache tab in Settings**, showing how much disk each remote's cache is using and
  offering to clear it. Clearing is refused while the remote is connected, while
  anything is still uploading, or when the cache cannot be read — a file that has not
  reached the provider exists only there.
  ([#84](https://github.com/mlaify/grrclone/issues/84))

## [0.4.0] - 2026-09-18

### Added

- **Delete a remote**, from its page in Settings. grrclone refuses while any file is
  still waiting to upload — the local cache holds the only copy of those — disconnects
  the volume first, and copies your rclone configuration alongside itself before
  changing it. Your files on the storage provider are never touched, and the
  confirmation says so before anything else.
  ([#69](https://github.com/mlaify/grrclone/issues/69))

### Fixed

- A daemon left behind by a crash is no longer killed before the volumes it is serving
  are unmounted. It was killed first, which left macOS talking to a storage server that
  no longer existed: for a few seconds after launch, anything touching those folders got
  an I/O error and writes in flight failed.
  ([#71](https://github.com/mlaify/grrclone/issues/71))
- If a crashed session's volumes cannot be disconnected at startup, grrclone now
  refuses to start and names them, rather than killing the background process anyway
  and leaving those volumes connected to nothing.
  ([#71](https://github.com/mlaify/grrclone/issues/71))
- A failed start no longer leaves an rclone process running that nothing can find or
  stop, and that a retry would stack a second copy on top of.
  ([#72](https://github.com/mlaify/grrclone/issues/72))
- The log viewer now removes `Authorization` headers, cookies and AWS request
  signatures. Previously an OAuth token or a base64 username and password could survive
  into a log the user was invited to copy into a bug report.
  ([#73](https://github.com/mlaify/grrclone/issues/73))
- grrclone refuses to start rather than fall back to predictable control-socket
  credentials if the system cannot supply random bytes.
  ([#74](https://github.com/mlaify/grrclone/issues/74))
- A damaged record of which volumes grrclone mounted is now reported and set aside,
  instead of being read as "grrclone mounted nothing" — which would have left those
  volumes connected with nothing behind them after quitting.
  ([#75](https://github.com/mlaify/grrclone/issues/75))
- Disconnecting no longer leaves a volume showing as connected when it has actually been
  unmounted, which also stopped grrclone leaving rclone running after it quit.
  ([#76](https://github.com/mlaify/grrclone/issues/76))
- Changing a connection's name, read-only setting or cache size while it is mounted now
  says the change is saved but not yet in force, and offers to remount. It used to look
  saved and do nothing — so **Read only** could appear to be on for a volume that was
  still accepting writes. ([#77](https://github.com/mlaify/grrclone/issues/77))
- A connection saved by an older version with the retired WebDAV transport now loads
  normally instead of being permanently unable to connect.
  ([#78](https://github.com/mlaify/grrclone/issues/78))
- Encrypting the configuration now refuses when grrclone cannot tell where the
  configuration lives, rather than running the command against nothing and reporting a
  confusing failure. ([#79](https://github.com/mlaify/grrclone/issues/79))
- Settings no longer claims the configuration is unencrypted when it simply could not
  read it. It says so instead. ([#80](https://github.com/mlaify/grrclone/issues/80))

## [0.3.2] - 2026-09-18

### Changed

- Every explanatory line in Settings cut to one line or less. The text was accurate and
  nobody was reading it.

## [0.3.1] - 2026-09-17

### Fixed

- The add-remote wizard was unusable in the shipped build. Clicking the provider search
  box closed the window, and the provider list came back empty. Two unrelated causes,
  both invisible to the tests.

## [0.3.0] - 2026-09-17

### Added

- An add-remote wizard, so a new remote no longer needs `rclone config` in a terminal.
  The form is generated from rclone itself — 69 providers, 968 options — rather than
  hand-written per backend.
- OAuth backends complete their sign-in in the browser, with no terminal.
- An offer to encrypt `rclone.conf`, with the password optionally kept in the keychain.

### Changed

- The interface no longer implies that stored remote credentials are encrypted. They are
  obscured, which `rclone reveal` undoes in one step, and nothing said so where anyone
  would see it.

### Documented

- That a soft mount turns a dead backend into an I/O error after roughly two minutes,
  rather than hanging forever.
- What grrclone cannot fix: file locks are local to one Mac, and AppleDouble `._` files
  appear on remotes.

## [0.2.0] - 2026-09-17

### Added

- Encrypted `rclone.conf` support, with the password optionally in the keychain.
- A configurable mount folder, so grrclone can take over the paths an existing setup
  already uses.
- A bandwidth limit for all transfers, applied immediately without a restart.
- A log viewer, with the detail level changeable while running.
- Opt-in update checks, with a pre-release channel. Off unless you turn them on.

### Fixed

- The menu drew its connection rows behind the footer, so the list of mounts was the one
  thing you could not see.
- A mountpoint left behind by a crash accepted writes that then vanished when the volume
  came back over the top of them.

## [0.1.0] - 2026-09-17

First release. Signed, notarised, and installable from a Homebrew tap or a DMG.

- Finds the remotes already in `rclone.conf` and mounts them as Finder volumes.
- Connects and disconnects, reconnects at login, and repairs mounts after sleep or a
  network change.
- Tears mounts down in the right order at quit, so Finder never hangs on a dead server.

[Unreleased]: https://github.com/mlaify/grrclone/compare/v0.9.5...HEAD
[0.9.5]: https://github.com/mlaify/grrclone/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/mlaify/grrclone/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/mlaify/grrclone/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/mlaify/grrclone/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/mlaify/grrclone/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/mlaify/grrclone/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/mlaify/grrclone/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/mlaify/grrclone/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/mlaify/grrclone/compare/v0.6.1...v0.7.0
[0.6.1]: https://github.com/mlaify/grrclone/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/mlaify/grrclone/compare/v0.4.0...v0.6.0
[0.4.0]: https://github.com/mlaify/grrclone/compare/v0.3.2...v0.4.0
[0.3.2]: https://github.com/mlaify/grrclone/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/mlaify/grrclone/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/mlaify/grrclone/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/mlaify/grrclone/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/mlaify/grrclone/releases/tag/v0.1.0
