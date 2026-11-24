set shell := ["bash", "-uc"]

default:
    @just --list --unsorted

# Full gate: skills, README table, manifests, script self-tests, Claude validator.
check:
    #!/usr/bin/env bash
    set -uo pipefail
    fail=0
    ./scripts/check.ts || fail=1
    npx --no-install tsc --noEmit || fail=1
    claude plugin validate . || fail=1
    exit "$fail"

# Rewrite the skill table in README.md.
index:
    @./scripts/check.ts --index

# Test the gate itself.
self-test:
    @./scripts/check.ts --self-test

# Raise the Codex version (patch|minor|major). Add the CHANGELOG section afterwards.
bump level="patch":
    @./scripts/check.ts --bump {{level}}
