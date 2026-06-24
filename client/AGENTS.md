# CLAUDE.md — Client (`@devdigest/web`)

Next.js studio for repo onboarding, PR browsing, review runs, findings triage, agents, and settings.

## Scope

- Next.js App Router app on `:3000`
- TanStack Query data layer (`src/lib/hooks/*`)
- API calls via `src/lib/api.ts` to `NEXT_PUBLIC_API_BASE` (default `http://localhost:3001`)
- Shared contracts/UI via vendored packages

## Primary Docs

- `client/README.md` (route map and frontend architecture)
- `README.md` (root startup and package layout)
- `TESTING.md` (suite boundaries and CI)
- `../e2e/README.md` (browser validation paths)

## Key Internal Areas

- `src/app/` — route entries and app-level layouts
- `src/components/` — composable UI pieces
- `src/lib/hooks/` — API data hooks and query behavior
- `src/vendor/ui/` — shared UI primitives
- `src/vendor/shared/` — shared contracts/types

## Runtime/Dev Commands

- `pnpm dev`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`

## Specs + Contracts to Respect

- API schemas from `src/vendor/shared/contracts/`
- Prompt-driven review semantics from `../docs/agent-prompts/`
- End-to-end behavior specs in `../e2e/specs/*.flow.json`
