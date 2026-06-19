# LEARNINGS — client (@devdigest/web)

Non-obvious findings from working in the Next.js frontend. Append-only — never overwrite, only add. Each entry: date + what + why non-obvious + `file:line` evidence.

---

## What Works

<!-- Approaches and patterns confirmed to work well in this module -->

## What Doesn't Work

<!-- Dead ends, antipatterns, silent failures — most commonly skipped, most valuable -->

## Codebase Patterns

**2026-06-19** — The shared Zod contracts under `client/src/vendor/shared/` are a separate copy from `server/src/vendor/shared/` — not a symlink or workspace package. Both must be edited in sync. Drift compiles fine (TypeScript sees only its own copy) but causes runtime parse failures when API responses don't match what the client schema expects. (`client/src/vendor/shared/contracts/trace.ts`, `server/src/vendor/shared/contracts/trace.ts`)

**2026-06-19** — `RunStats` is used both as a live API contract and serialized into the JSONB `run_traces.trace` column. Old trace documents won't have new fields. Using `z.number().nullable()` (not `.nullish()`) is safe because Zod coerces a missing key to `null` on parse when the field is nullable — confirmed when adding `cost_usd` without breaking existing stored traces. (`client/src/vendor/shared/contracts/trace.ts:61`)

## Tool & Library Notes

<!-- Dependency quirks, Next.js/React version-specific gotchas, config surprises -->

## Recurring Errors & Fixes

<!-- Errors seen more than once + the confirmed fix (date each entry) -->

## Session Notes

**2026-06-19** — Implemented client side of Run Cost Badge. Added `cost_usd` to `RunStats`, `RunSummary`, `PrMeta` contracts; added `formatCost()` to `lib/format.ts` (shared); added COST stat card to `TraceBody`, inline token+cost display to `RunHistory`, and Cost column to `PRRow`/`constants.ts`. Updated test fixtures in `RunTraceDrawer.test.tsx` and `RunHistory.test.tsx`.

## Open Questions

<!-- Unresolved: things suspected but not yet confirmed -->
