# LEARNINGS — client (@devdigest/web)

Non-obvious findings from working in the Next.js frontend. Append-only — never overwrite, only add. Each entry: date + what + why non-obvious + `file:line` evidence.

---

## What Works

**2026-06-20** — `ReactDOM.createPortal` to `document.body` with `position: fixed` + `getBoundingClientRect()` is the correct pattern for any popover/dropdown inside the PR list table. The table card has `overflow: hidden` (`styles.ts:87`), so `position: absolute` children are clipped — the bug is invisible until the popover actually extends below the row. (`client/src/app/repos/[repoId]/pulls/_components/FindingsCell/FindingsCell.tsx`)

## What Doesn't Work

**2026-06-20** — `position: absolute` popovers inside `.tableCard` are silently clipped — `overflow: hidden` is set on the card to achieve rounded corners, so any child that overflows the row boundary disappears without a console error. The failure only shows visually. Fix: portal to `document.body` with `position: fixed`. (`client/src/app/repos/[repoId]/pulls/styles.ts:87`)

## Codebase Patterns

**2026-06-20** — `SEV` (in `vendor/ui/primitives/tokens.ts`) is the single source of truth for severity icon, color, and label. Do not define local `SEV_COLOR` or similar maps — `FindingCard/constants.ts` has a redundant one that pre-dates `SEV` and should not be copied. Always import `SEV` and `Severity` from `@devdigest/ui`. (`client/src/vendor/ui/primitives/tokens.ts:6`)

**2026-06-20** — `RunSummary` (the timeline row) carries only `findings_count` + `blockers` — no per-severity breakdown and no finding content. To show severity chips or a findings popover on a timeline run row, join against `ReviewRecord[]` (already fetched by `usePrReviews`) by `run_id` in the parent, then pass `Map<runId, FindingRecord[]>` down as a prop. Adding a `findings_by_severity` field to `RunSummary` is unnecessary. (`client/src/vendor/shared/contracts/trace.ts:94`, `client/src/app/repos/[repoId]/pulls/[number]/_components/FindingsTab/FindingsTab.tsx`)

**2026-06-20** — The `GET /repos/:id/pulls` route has a deliberate comment stating findings breakdown was "intentionally not surfaced on the list". Adding `findings_by_severity` required a single grouped JOIN query (`findings → reviews`) and one new optional field on `PrMeta` — not a separate endpoint. The cost: one extra query per list load, cheap because prIds are already in scope. (`server/src/modules/pulls/routes.ts:117`)

**2026-06-19** — The shared Zod contracts under `client/src/vendor/shared/` are a separate copy from `server/src/vendor/shared/` — not a symlink or workspace package. Both must be edited in sync. Drift compiles fine (TypeScript sees only its own copy) but causes runtime parse failures when API responses don't match what the client schema expects. (`client/src/vendor/shared/contracts/trace.ts`, `server/src/vendor/shared/contracts/trace.ts`)

**2026-06-19** — `RunStats` is used both as a live API contract and serialized into the JSONB `run_traces.trace` column. Old trace documents won't have new fields. Using `z.number().nullable()` (not `.nullish()`) is safe because Zod coerces a missing key to `null` on parse when the field is nullable — confirmed when adding `cost_usd` without breaking existing stored traces. (`client/src/vendor/shared/contracts/trace.ts:61`)

## Tool & Library Notes

<!-- Dependency quirks, Next.js/React version-specific gotchas, config surprises -->

## Recurring Errors & Fixes

<!-- Errors seen more than once + the confirmed fix (date each entry) -->

## Session Notes

**2026-06-20** — Added severity filtering across three surfaces: (1) `SeverityFilterBar` + `ReviewRunAccordion` filter on PR detail findings tab; (2) `FindingsCell` with portal popover on the PR list FINDINGS column (required backend `findings_by_severity` query); (3) `RunFindingsBadges` with inline popover on RunHistory timeline rows (no backend change — derived from `ReviewRecord[]` by `run_id`). Key bug: table card `overflow:hidden` clipped the PR list popover — fixed via `createPortal` + `position: fixed`.

**2026-06-19** — Implemented client side of Run Cost Badge. Added `cost_usd` to `RunStats`, `RunSummary`, `PrMeta` contracts; added `formatCost()` to `lib/format.ts` (shared); added COST stat card to `TraceBody`, inline token+cost display to `RunHistory`, and Cost column to `PRRow`/`constants.ts`. Updated test fixtures in `RunTraceDrawer.test.tsx` and `RunHistory.test.tsx`.

## Open Questions

<!-- Unresolved: things suspected but not yet confirmed -->
