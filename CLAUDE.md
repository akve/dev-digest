# CLAUDE.md — DevDigest System Guide

This file is the top-level orientation guide for AI/code agents working in this repository.

## System Overview

DevDigest is a local-first AI pull-request review system with four primary runtime parts:

- `server/` (`@devdigest/api`) — Fastify API and orchestration (`:3001`)
- `client/` (`@devdigest/web`) — Next.js web studio (`:3000`)
- `reviewer-core/` (`@devdigest/reviewer-core`) — pure review engine
- `e2e/` (`@devdigest/e2e`) — deterministic browser E2E specs

Supporting parts:

- `server/src/modules/repo-intel/` — repository indexing and repo map generation
- `docs/agent-prompts/` — reviewer prompt specifications
- `server/src/vendor/shared/` — shared Zod contracts consumed across packages

## How to Run

See **[README.md — How to Run](README.md#how-to-run)** for the full guide. Quick reference:

- **Fastest:** `./scripts/dev.sh` — starts Postgres, migrates, seeds, and launches both servers
- **Manual:** `docker compose up -d` → `cd server && pnpm db:migrate && pnpm dev` → `cd client && pnpm dev`
- **Ports:** UI `:3000` · API `:3001` · Postgres `:5432`
- **Keys:** set `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN` in `server/.env` or via Settings UI

## Core Docs (Read First)

- `README.md` — architecture, startup, environment, and operational workflow ([How to Run](README.md#how-to-run))
- `TESTING.md` — repository-wide testing strategy and CI split
- `server/README.md` — backend architecture and route map
- `client/README.md` — UI route map and frontend patterns
- `reviewer-core/README.md` — prompt + grounding pipeline details
- `e2e/README.md` — E2E runner model and execution constraints
- `server/src/modules/repo-intel/README.md` — indexing pipeline and facade

## Prompt Docs and Specs

- `docs/agent-prompts/README.md` — prompt assembly contract and required conventions
- `docs/agent-prompts/general-reviewer.md`
- `docs/agent-prompts/security-reviewer.md`
- `docs/agent-prompts/performance-reviewer.md`
- `docs/agent-prompts/choosing-a-model.md`

## E2E Spec Files

These are executable browser flow specs:

- `e2e/specs/01-app-boot.flow.json`
- `e2e/specs/02-repo-pulls-detail.flow.json`
- `e2e/specs/03-agents.flow.json`
- `e2e/specs/04-pr-findings.flow.json`
- `e2e/specs/05-pr-diff.flow.json`
- `e2e/specs/06-onboarding.flow.json`
- `e2e/specs/07-settings.flow.json`

## Section Guides

Each major area has a local guide:

- `server/CLAUDE.md`
- `client/CLAUDE.md`
- `reviewer-core/CLAUDE.md`
- `e2e/CLAUDE.md`
- `docs/CLAUDE.md`
- `server/src/modules/repo-intel/CLAUDE.md`

## Engineering Insights — Session Protocol

Each module has a `INSIGHTS.md` with seven fixed sections (What Works · What Doesn't Work · Codebase Patterns · Tool & Library Notes · Recurring Errors & Fixes · Session Notes · Open Questions). See `engineering-insights.md` for the full index and entry format.

**Session start:** Before beginning any work, read the `INSIGHTS.md` for the module(s) you'll touch. Confirm by stating the top 3 most relevant points. This is required — not optional.

**Session end:** After any session longer than ~30 min that involved a problem, fix, or discovery, run `/engineering-insights` to append findings to the relevant module's `INSIGHTS.md`. Do not skip this step.

**What to capture:** behaviors that contradict what the code appears to do, constraints not in comments or READMEs, gotchas that caused or could cause bugs, deliberate tradeoffs, dead ends. Skip anything obvious from reading the code or already documented.

## Working Rules

- Validate behavior at boundaries (routes/contracts/adapters), not internals.
- Keep `reviewer-core` pure and dependency-injected.
- Treat prompts and E2E specs as versioned product behavior.
- Prefer deterministic tests and grounded findings over heuristic outputs.
