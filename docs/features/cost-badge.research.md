# Run Cost Badge — Research

**Feature:** Show cost and token counts for each completed run in two UI locations.
**Constraint:** Zero additional model calls; cost derived from already-captured token counts.

---

## Display Locations

### 1. Agent Runs Timeline row (PR detail, "Agent runs" tab)
Format: `9,119 tok · $0.0013` displayed inline on each run row.
Component: `client/src/app/repos/[repoId]/pulls/[number]/_components/RunHistory/RunHistory.tsx`
- `tokens_in` and `tokens_out` are already in `RunSummary` (lines 102–103 of `trace.ts`) — but are **not currently rendered**
- `cost_usd` is absent from `RunSummary` — must be added

### 2. Trace drawer Stats section ("Trace · completed" panel)
Format: fourth stat card `COST / $0.06` alongside DURATION, TOKENS, FINDINGS.
Component: `client/src/app/repos/[repoId]/pulls/[number]/_components/RunTraceDrawer/_components/TraceBody/TraceBody.tsx` (line 63–67)
- Existing stats grid: `<Stat label={t("trace.stat.duration")} ...>`, tokens, findings
- `cost_usd` is absent from `RunStats` contract — must be added

### 3. PR list COST column
Format: compact `$0.012` in the PR row.
Component: `client/src/app/repos/[repoId]/pulls/_components/PRRow/PRRow.tsx`
- `PRMeta` contract currently has `score` but no cost — requires aggregation (sum of run costs for the PR) at the API level

---

## Data Flow Audit

### Where cost is computed
`reviewer-core/src/review/run.ts` (lines 157–184): accumulates `costUsd` across all LLM calls in a run:
```ts
costUsd = costUsd == null || res.costUsd == null ? null : costUsd + res.costUsd;
```
`costUsd` is part of the returned `outcome` object.

### Where cost is dropped
`server/src/modules/reviews/run-executor.ts` line 213:
```ts
const { tokensIn, tokensOut, grounding } = outcome;  // costUsd silently discarded
```
`completeAgentRun()` (`run.repo.ts:141`) has no `costUsd` param — cost is never saved.

### DB schema state
`server/src/db/schema/runs.ts`: `agentRuns` table has `tokensIn`, `tokensOut` but **no `cost_usd`** — it was dropped in migration `0009_complex_runaways.sql`:
```sql
ALTER TABLE "agent_runs" DROP COLUMN "cost_usd";
```

### Cost estimation fallback
`server/src/adapters/llm/pricing.ts` — `estimateCost(model, tokensIn, tokensOut)` can re-derive cost from stored tokens if `cost_usd` is null. This is a fallback only; preferred path is storing the exact cost at run time (includes OpenRouter's native cost via `res.usage.cost`).

### RunStats and RunTrace
`server/src/vendor/shared/contracts/trace.ts`:
- `RunStats` (lines 61–67): `duration_ms`, `tokens_in`, `tokens_out`, `findings`, `grounding` — no `cost_usd`
- `RunSummary` (lines 94–113): same gap — no `cost_usd`
- `RunTrace.stats` uses `RunStats` — the persisted JSONB trace document also lacks cost

---

## Required Changes

### Server

| File | Change |
|------|--------|
| `server/src/db/schema/runs.ts` | Add `costUsd: doublePrecision('cost_usd')` to `agentRuns` table |
| `server/src/db/migrations/XXXX_add_cost_usd_to_agent_runs.sql` | `ALTER TABLE agent_runs ADD COLUMN cost_usd double precision;` |
| `server/src/vendor/shared/contracts/trace.ts` — `RunStats` | Add `cost_usd: z.number().nullable()` |
| `server/src/vendor/shared/contracts/trace.ts` — `RunSummary` | Add `cost_usd: z.number().nullable()` |
| `server/src/modules/reviews/repository/run.repo.ts` — `completeAgentRun()` | Accept `costUsd?: number \| null`, save it in the `UPDATE` |
| `server/src/modules/reviews/repository/run.repo.ts` — `listRunsForPull()` | Include `cost_usd: run.costUsd` in mapped result |
| `server/src/modules/reviews/run-executor.ts` line 213 | Destructure `costUsd` from outcome, pass to `completeAgentRun()` |
| `server/src/modules/reviews/run-executor.ts` — trace building (line 264) | Add `cost_usd: outcome.costUsd` to `stats` object |
| `server/src/modules/reviews/run-executor.ts` — `failAll` path | Pass `costUsd: null` to `completeAgentRun()` |

For **PR list cost column** (location 3), also needed:
| File | Change |
|------|--------|
| PRMeta contract (`review-api.ts` or `pulls` contract) | Add `last_cost_usd: z.number().nullable()` |
| PR list query in pulls repository | Left-join/subquery to sum `cost_usd` from `agent_runs` for the PR's latest run set |

### Client

| File | Change |
|------|--------|
| `client/src/vendor/shared/contracts/trace.ts` — `RunStats` | Mirror server: add `cost_usd: z.number().nullable()` |
| `client/src/vendor/shared/contracts/trace.ts` — `RunSummary` | Mirror server: add `cost_usd: z.number().nullable()` |
| `client/src/app/repos/[repoId]/pulls/[number]/_components/RunTraceDrawer/helpers.ts` | Add `formatCost(usd: number \| null): string` — returns `"—"` on null, `"$0.0013"` with adaptive precision |
| `client/src/app/repos/[repoId]/pulls/[number]/_components/RunTraceDrawer/_components/TraceBody/TraceBody.tsx` line 66 | Add `<Stat label={t("trace.stat.cost")} val={formatCost(stats.cost_usd)} />` after TOKENS |
| `client/src/app/repos/[repoId]/pulls/[number]/_components/RunHistory/RunHistory.tsx` | Add inline `tok · $cost` display on each completed run row |
| `client/messages/en/runs.json` | Add `"trace.stat.cost": "COST"` key |

---

## Key Invariants

- **Run without data → `"—"`, not `"$0.00"`**: `formatCost(null)` must return `"—"`.
- **`costUsd` null propagation is correct**: if any LLM call in a run has an unknown model, the whole run's cost is null. This is intentional (already implemented in `reviewer-core/src/review/run.ts:184`).
- **The JSONB trace document** (`run_traces.trace`) stores a serialized `RunTrace`. Adding `cost_usd` to `RunStats` means new traces get it; old traces (pre-migration) will have it as undefined — `z.number().nullable()` on the schema handles this gracefully.
- **No extra model calls**: cost is a product of already-captured `tokensIn`/`tokensOut`/`costUsd` from the LLM response — no new AI invocations.

---

## Existing Utilities to Reuse

| Utility | Location | Notes |
|---------|----------|-------|
| `formatTokens(tokensIn, tokensOut)` | `RunTraceDrawer/helpers.ts:26` | Already renders `15k→1.2k` — reuse for token display in RunHistory |
| `Badge` component | `client/src/vendor/ui/primitives/Badge.tsx` | Flexible: color, icon, mono — use for inline cost badge in RunHistory |
| `Stat` atom | `RunTraceDrawer/_components/atoms.tsx` | Already used for DURATION/TOKENS/FINDINGS cards — add COST as 4th |
| `estimateCost(model, tokensIn, tokensOut)` | `server/src/adapters/llm/pricing.ts:37` | Fallback if stored cost is null (not needed in normal flow) |

---

## Format Spec

| Context | Format | Example |
|---------|--------|---------|
| Trace stat card | `$` + adaptive decimal | `$0.06`, `$0.0013`, `$1.23` |
| Timeline row inline | `{totalTok} tok · ${cost}` | `9,119 tok · $0.0013` |
| PR list column | compact `$X.XXX` | `$0.012` |
| No data | em dash | `—` |

Adaptive precision rule (for `formatCost`):
- `≥ $1.00` → 2 decimal places (`$1.23`)
- `≥ $0.01` → 3 decimal places (`$0.012`)
- `< $0.01` → 4 decimal places (`$0.0013`)
