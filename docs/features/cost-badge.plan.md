# Run Cost Badge — Implementation Plan

**Goal:** Surface `cost_usd` and token counts on every completed run in three UI locations.
**Constraint:** Zero additional model calls; no new API endpoints; no backwards-breaking changes.

---

## Context

`cost_usd` was dropped from `agent_runs` in migration 0009. The reviewer-core engine still computes and returns it in `outcome.costUsd`, but `run-executor.ts` silently discards it (line 213). Nothing downstream stores or surfaces it. This plan restores the column, threads the value through to the client, and renders it in three places.

---

## Locations

| # | Where | Format | Data source |
|---|-------|--------|-------------|
| 1 | Trace drawer — Stats section | `COST / $0.06` (4th stat card) | `RunStats.cost_usd` from JSONB trace |
| 2 | Agent runs timeline rows | `9,119 tok · $0.0013` inline | `RunSummary.cost_usd` from `agent_runs` |
| 3 | PR list — COST column | `$0.012` | Sum of `agent_runs.cost_usd` per PR (computed on read) |

---

## Implementation Steps

### Step 1 — DB: restore `cost_usd` column

**File:** `server/src/db/migrations/0010_add_cost_usd_to_agent_runs.sql`
```sql
ALTER TABLE "agent_runs" ADD COLUMN "cost_usd" double precision;
```

**File:** `server/src/db/schema/runs.ts`  
Add to `agentRuns` table definition after `tokensOut`:
```ts
costUsd: doublePrecision('cost_usd'),
```

---

### Step 2 — Server: persist cost on run completion

**File:** `server/src/modules/reviews/repository/run.repo.ts`

`completeAgentRun()` (line 141): add `costUsd?: number | null` to the `values` param and include it in the `UPDATE` set:
```ts
costUsd: values.costUsd ?? null,
```

`listRunsForPull()` (line 51): add `cost_usd: run.costUsd` to the mapped result object.

---

### Step 3 — Server: thread `costUsd` through run-executor

**File:** `server/src/modules/reviews/run-executor.ts`

Line 213 — destructure `costUsd` from `outcome`:
```ts
const { tokensIn, tokensOut, grounding, costUsd } = outcome;
```

Line 243 — pass to `completeAgentRun()`:
```ts
costUsd,
```

Line 264 — add to the trace `stats` object:
```ts
cost_usd: costUsd,
```

`failAll` path (line 78): pass `costUsd: null` to `completeAgentRun()`.
Cancellation path (line 298): pass `costUsd: null`.

---

### Step 4 — Shared contracts: add `cost_usd` field

**File:** `server/src/vendor/shared/contracts/trace.ts`  
(mirrored in `client/src/vendor/shared/contracts/trace.ts`)

`RunStats` (line 61): add
```ts
cost_usd: z.number().nullable(),
```

`RunSummary` (line 94): add
```ts
cost_usd: z.number().nullable(),
```

> Both copies (server `src/vendor/shared/` and client `src/vendor/shared/`) must be updated identically. Old traces stored as JSONB will have `cost_usd: undefined` — the `.nullable()` type handles this as `null`.

---

### Step 5 — Client: `formatCost` utility

**File:** `client/src/app/repos/[repoId]/pulls/[number]/_components/RunTraceDrawer/helpers.ts`

Add after `formatTokens`:
```ts
export function formatCost(usd: number | null | undefined): string {
  if (usd == null) return '—';
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(4)}`;
}
```

---

### Step 6 — Client: Trace drawer COST stat card (Location 1)

**File:** `client/src/app/repos/[repoId]/pulls/[number]/_components/RunTraceDrawer/_components/TraceBody/TraceBody.tsx`

Line 66 — add after the TOKENS stat:
```tsx
<Stat label={t("trace.stat.cost")} val={formatCost(stats.cost_usd)} />
```

**File:** `client/messages/en/runs.json`  
Add: `"trace.stat.cost": "COST"`

---

### Step 7 — Client: RunHistory timeline row inline cost (Location 2)

**File:** `client/src/app/repos/[repoId]/pulls/[number]/_components/RunHistory/RunHistory.tsx`

On completed run rows, add a `tok · $cost` display in the right section alongside the timestamp. Show only when `status === 'done'` and either `tokens_in` or `cost_usd` is non-null.

Format: `{formatTokens(run.tokens_in, run.tokens_out)} · {formatCost(run.cost_usd)}`  
Render as a `<Badge mono>` or plain `<span className="mono">` with muted color — matching the existing `"9,119 tok · $0.0013"` screenshot style.

Import `formatCost` and `formatTokens` from `../../helpers`.

---

### Step 8 — Client + Server: PR list COST column (Location 3)

**Server — `server/src/modules/pulls/routes.ts`** (line 118–130):

Alongside the existing `latestReviewByPr` score aggregation, add a second IN-query to sum `cost_usd` per PR:
```ts
const costByPr = new Map<string, number | null>();
if (prIds.length > 0) {
  const costRows = await container.db
    .select({ prId: t.agentRuns.prId, total: sum(t.agentRuns.costUsd) })
    .from(t.agentRuns)
    .where(inArray(t.agentRuns.prId, prIds))
    .groupBy(t.agentRuns.prId);
  for (const cr of costRows) {
    costByPr.set(cr.prId, cr.total != null ? Number(cr.total) : null);
  }
}
```

Add `cost_usd: costByPr.get(r.id) ?? null` to each mapped PR row.

**Shared contract — `platform.ts`** (`PrMeta`, line 157):
```ts
cost_usd: z.number().nullable().nullish(),
```

**Client — `PRRow.tsx`**: add a COST cell rendering `formatCost(pr.cost_usd)` with `"—"` fallback.

**Client — `constants.ts`** (grid layout): extend `GRID` to accommodate the new column, e.g. `"1fr 132px 92px 60px 80px 118px 78px"` (add ~80px for COST).

**Client — `formatCost`**: reuse the helper from Step 5 (import from `RunTraceDrawer/helpers` or extract to `lib/format.ts` if shared across pages).

> If `formatCost` is needed in both `RunTraceDrawer` and `PRRow`, extract it to `client/src/lib/format.ts` and import from both.

---

## Invariants

- `cost_usd = null` → render `"—"`, never `"$0.00"`.
- Null propagation is correct: if any LLM call in a run has an unknown model, the whole run's cost is null (implemented in `reviewer-core/src/review/run.ts:184`). Do not override this.
- Old persisted JSONB traces (`run_traces.trace`) lack `cost_usd` in `stats` — the nullable contract field handles this; `formatCost(undefined)` returns `"—"`.
- The `sum()` Drizzle import comes from `drizzle-orm`.

---

## Delivery Order

Steps 1–4 are server-side and must land before client rendering has real data.  
Steps 5–7 are independent of Step 8 and can be done in parallel.  
Step 8 (PR list) is the most involved; it can ship in a follow-up if needed.

## Verification

1. Run a review against any PR.
2. Open the Trace drawer → Stats section shows COST card with a dollar value.
3. Agent runs timeline row shows `Xk→Yk tok · $Z.ZZZZ`.
4. PR list shows COST column with the summed cost.
5. For a failed/cancelled run: all three locations show `"—"`.
6. For a run with an unknown model (pricing table miss): `cost_usd` is null → `"—"`.
7. `pnpm typecheck` passes in both `server/` and `client/`.
