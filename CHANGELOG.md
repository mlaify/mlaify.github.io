# Changelog

All notable changes to this site are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `SECURITY.md` at repository root following the [disclose.io](https://disclose.io) vulnerability disclosure framework.
- `/security/` page mirroring the disclosure policy in a site-friendly format.
- `/privacy/` page describing how the static site handles visitor data (no analytics, no ad tracking, no first-party cookies).
- `static/.well-known/security.txt` for machine-readable security contact discovery (expires 2027-05-08).
- `static/humans.txt` describing the site, stack, and contact details.
- `static/privacy.json` providing a structured (v1.0) privacy declaration.

### Changed

- All references to "ML AI LLC" and "M&L AI LLC" replaced with "mlaify" across content, configs, and static files.
- Standalone "ML AI Project Hub" / "ML AI" brand references normalized to "mlaify" everywhere they appear as the project or organization name.
- `.claude/` added to `.gitignore` so Claude Code worktrees and session state stay out of the repository.
