# INSIGHTS — server (@devdigest/api)

Non-obvious findings from working in the Fastify API and Drizzle/Postgres layer. Append-only — never overwrite, only add. Each entry: date + what + why non-obvious + `file:line` evidence.

---

## What Works

<!-- Approaches and patterns confirmed to work well in this module -->

## What Doesn't Work

**2026-06-19** — Hand-written `.sql` migration files are silently skipped by Drizzle's migrator unless an entry also exists in `src/db/migrations/meta/_journal.json`. `pnpm db:migrate` prints `✓ migrations applied` regardless — no error, no warning. The fix is to add the journal entry manually *and* apply the SQL directly via `docker exec … psql`. (`src/db/migrations/meta/_journal.json`, `src/db/migrate.ts`)

## Codebase Patterns

**2026-06-19** — `completeAgentRun()` has two separate type signatures that must be kept in sync: the implementation in `src/modules/reviews/repository/run.repo.ts` and the wrapper in `src/modules/reviews/repository.ts` (`ReviewRepository` class). `run-executor.ts` calls the wrapper, so adding a param to only the implementation compiles but the wrapper silently rejects it at the type level. (`src/modules/reviews/repository.ts:151`, `src/modules/reviews/repository/run.repo.ts:141`)

**2026-06-19** — `costUsd` was previously in `agent_runs`, intentionally dropped in migration 0009, but `reviewPullRequest()` in reviewer-core still computes and returns it. It was silently discarded at `run-executor.ts:213` via destructuring that omitted it — not obvious from reading the executor. The value is always available; it just wasn't being saved. (`server/src/modules/reviews/run-executor.ts:213`, `reviewer-core/src/review/run.ts:159`)

## Tool & Library Notes

<!-- Dependency quirks, Fastify/Drizzle/Postgres version-specific gotchas, config surprises -->

## Recurring Errors & Fixes

<!-- Errors seen more than once + the confirmed fix (date each entry) -->

## Session Notes

**2026-06-20** — Added `findings_by_severity` to `GET /repos/:id/pulls`. One grouped JOIN query (`findings INNER JOIN reviews WHERE pr_id IN (...)  GROUP BY pr_id, severity`) appended after the existing cost aggregation — same pattern, minimal impact. Added optional field to `PrMeta` Zod schema in both server and client vendor copies.

**2026-06-19** — Implemented Run Cost Badge feature. Restored `cost_usd` to `agent_runs` (dropped in 0009), threaded `costUsd` through `run-executor` → `completeAgentRun` → `listRunsForPull`, added it to `RunStats`/`RunSummary`/`PrMeta` contracts, and added a cost aggregation query to the PR list route. Hit the silent-migration-skip gotcha (journal entry required); applied column via `docker exec psql` as workaround.

## Open Questions

<!-- Unresolved: things suspected but not yet confirmed -->
