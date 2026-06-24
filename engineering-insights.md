# Engineering Insights — Index

Each module keeps its own `INSIGHTS.md` with seven fixed sections. Run `/engineering-insights` at the end of a session to append findings automatically.

## Module files

| Module | Path |
|--------|------|
| client | [`client/INSIGHTS.md`](client/INSIGHTS.md) |
| server | [`server/INSIGHTS.md`](server/INSIGHTS.md) |
| reviewer-core | [`reviewer-core/INSIGHTS.md`](reviewer-core/INSIGHTS.md) |
| repo-intel | [`server/src/modules/repo-intel/INSIGHTS.md`](server/src/modules/repo-intel/INSIGHTS.md) |
| e2e | [`e2e/INSIGHTS.md`](e2e/INSIGHTS.md) |

## Section structure (same in every file)

| Section | Purpose |
|---------|---------|
| What Works | Approaches and patterns confirmed to work well |
| What Doesn't Work | Dead ends, antipatterns, silent failures — don't skip this one |
| Codebase Patterns | Conventions and architectural decisions |
| Tool & Library Notes | Dependency quirks, version-specific gotchas |
| Recurring Errors & Fixes | Errors seen more than once + confirmed fix |
| Session Notes | Dated summaries of what happened each session |
| Open Questions | Suspected but not yet confirmed |

## Entry format

```
**YYYY-MM-DD** — <one sentence: what is non-obvious and why it matters> (`path/to/file.ts:line`)
```

Entries are append-only. Never overwrite. Correct with a new dated entry.

## Quality gate

Write it if it would surprise a contributor reading the code cold.
Skip it if it's obvious, generic, or already in a README.
