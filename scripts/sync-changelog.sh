#!/usr/bin/env bash
#
# Write content/<product>/changelog.md from the product's CHANGELOG.md at a
# release tag, so the page always matches a release:
#
#   scripts/sync-changelog.sh attackmap mlaify/AttackMap v0.6.2
#   scripts/sync-changelog.sh grrclone mlaify/grrclone v0.9.5
#
# Run it after a release and commit the result; the build itself never fetches
# anything. The changelog's own title is dropped (the page has one), and links
# relative to the product repo point at GitHub at that tag.

set -euo pipefail

if [ $# -ne 3 ]; then
	echo "usage: $0 <product> <owner/repo> <tag>" >&2
	exit 2
fi
product=$1 repo=$2 tag=$3
out="content/$product/changelog.md"
[ -d "content/$product" ] || { echo "no content/$product" >&2; exit 1; }

src=$(curl -fsSL "https://raw.githubusercontent.com/$repo/$tag/CHANGELOG.md")

{
	cat <<FRONT
---
title: "Changelog"
description: "What changed in each release, from $repo's CHANGELOG.md at $tag."
weight: 30
release: "$tag"
---

{{< callout type="note" >}}
From [CHANGELOG.md](https://github.com/$repo/blob/$tag/CHANGELOG.md) at
[$tag](https://github.com/$repo/releases/tag/$tag), the latest release. Changes on
\`main\` since then are in the [repository](https://github.com/$repo/blob/main/CHANGELOG.md).
{{< /callout >}}

FRONT
	# Drop the first "# ..." title line; rewrite relative links to GitHub.
	printf '%s\n' "$src" |
		sed '1{/^# /d}' |
		sed -E "s#\]\(([^):#][^):]*)\)#](https://github.com/$repo/blob/$tag/\1)#g"
} >"$out"

# Shortcode delimiters in the changelog would be executed by Hugo.
if grep -n '{{[<%]' "$out" | grep -v '{{< /\?callout' >/dev/null; then
	echo "$out: the changelog contains Hugo shortcode syntax; escape it before committing" >&2
	exit 1
fi
echo "wrote $out from $repo@$tag"
