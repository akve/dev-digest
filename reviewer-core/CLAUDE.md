# CLAUDE.md — Reviewer Core (`@devdigest/reviewer-core`)

Pure review engine: prompt assembly, structured model output parsing, grounding, and scoring.

## Scope

- No DB/GitHub/filesystem side effects
- LLM access only through injected provider interfaces
- Deterministic grounding gate against diff hunks
- Contracts shared through `@devdigest/shared`

## Primary Docs

- `reviewer-core/README.md` (pipeline and API)
- `../docs/agent-prompts/README.md` (prompt assembly and conventions)
- `../README.md` (overall architecture flow)
- `../TESTING.md` (test strategy alignment)

## Key Internal Areas

- `src/prompt.ts` — prompt assembly and untrusted wrapping
- `src/review/run.ts` — end-to-end single review run orchestration
- `src/grounding.ts` — citation grounding against diff lines
- `src/llm/` — structured output handling and providers
- `src/reduce.ts` — deterministic scoring/reduction

## Runtime/Dev Commands

- `npm test`
- `npm run typecheck`
- `npm run build` (typecheck-only build)

## Specs + Contracts to Respect

- Prompt requirements in `../docs/agent-prompts/*.md`
- Review schema from shared contracts (`server/src/vendor/shared/contracts/`)
- Grounding invariants: only findings with real diff citations survive
