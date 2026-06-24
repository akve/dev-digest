# CLAUDE.md — Server (`@devdigest/api`)

Backend for repository import, pull-request ingestion, indexing, agent configuration, and review execution.

## Scope

- Fastify API on `:3001`
- Drizzle + Postgres (`pgvector`)
- Review orchestration through `reviewer-core`
- Adapter-based integration with GitHub, LLMs, git, tokenizer, and secrets

## Primary Docs

- `server/README.md` (authoritative backend architecture)
- `README.md` (root startup/ports/dependencies)
- `TESTING.md` (unit vs integration strategy)
- `server/src/modules/repo-intel/README.md` (indexing internals)

## Key Internal Areas

- `src/modules/` — feature modules and route registration
- `src/platform/` — container/config/bootstrap
- `src/adapters/` — external side-effect implementations + mocks
- `src/db/` — schema, migrations, seed, DB helpers
- `src/vendor/shared/` — shared Zod contracts (`@devdigest/shared`)

## Runtime/Dev Commands

- `pnpm dev`
- `pnpm db:migrate`
- `pnpm db:seed`
- `pnpm test`
- `pnpm typecheck`

## Specs + Contracts to Respect

- API payload contracts in `src/vendor/shared/contracts/`
- Review output schema consumed by `reviewer-core`
- Prompt behavior docs in `../docs/agent-prompts/`

## Testing Lanes

- Unit (hermetic): `pnpm exec vitest run --exclude '**/*.it.test.ts'`
- Integration (real Postgres): `pnpm exec vitest run .it.test`

Use `.it.test.ts` only for DB-backed tests.
