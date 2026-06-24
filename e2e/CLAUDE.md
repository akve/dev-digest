# CLAUDE.md — E2E (`@devdigest/e2e`)

Deterministic browser end-to-end validation using `agent-browser` command flows.

## Scope

- JSON flow specs (`specs/*.flow.json`)
- Single-session command runner (`run.ts`)
- Assertion model based on command exit status and optional stdout checks

## Primary Docs

- `e2e/README.md` (runner semantics, hermetic mode, constraints)
- `../TESTING.md` (how E2E fits suite map and CI)
- `../README.md` (stack startup expectations)

## Spec Files

- `specs/01-app-boot.flow.json`
- `specs/02-repo-pulls-detail.flow.json`
- `specs/03-agents.flow.json`
- `specs/04-pr-findings.flow.json`
- `specs/05-pr-diff.flow.json`
- `specs/06-onboarding.flow.json`
- `specs/07-settings.flow.json`

## Execution Modes

- Recommended hermetic mode: `../scripts/e2e.sh`
- Against dev stack: `npm test` (requires clean seeded-state assumptions)

## Rules

- Keep specs deterministic (`--url`, `--text`, stable locators).
- Avoid AI-driven `chat` commands in flows.
- Treat flow JSON as product behavior specs, not ad-hoc scripts.
