#!/usr/bin/env bash
#
# Assert that the Hugo + Pagefind build produced everything the site needs
# before it is deployed.
#
# These checks came from the old GitHub Actions workflow and are kept because
# Workers Builds will happily deploy a technically-successful build that is
# missing its search index or its security.txt. Failing here means the bad
# build never becomes a deployment.
#
# Run by `npm run build:cf`, which is what Workers Builds executes.

set -euo pipefail

fail=0
note() {
	printf '  %s\n' "$1"
	fail=1
}

[ -f public/index.html ] || note "public/index.html missing"
[ -f public/404.html ] || note "public/404.html missing — not_found_handling: 404-page has nothing to serve"
[ -d public/pagefind ] || note "public/pagefind missing — search index not built"
[ -f public/.well-known/security.txt ] || note "public/.well-known/security.txt missing"

# Cloudflare reads public/_headers at deploy time and does not serve it. If it
# is absent the deploy still succeeds, silently dropping every security header
# and cache rule — the whole site's header policy lives in this one file, so
# check it explicitly.
[ -f public/_headers ] || note "public/_headers missing — static/_headers did not reach the build output"

if [ "$fail" -ne 0 ]; then
	printf 'Build output is not deployable.\n' >&2
	exit 1
fi

printf 'Build output looks sane (%s files).\n' "$(find public -type f | wc -l | tr -d ' ')"
