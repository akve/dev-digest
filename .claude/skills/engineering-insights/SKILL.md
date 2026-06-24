---
name: engineering-insights
description: "Captures non-obvious findings from the current session and appends them to the correct module's INSIGHTS.md. Use at the end of any session that involved a problem, fix, or discovery. Also use proactively mid-session when something non-obvious is confirmed — dead ends, silent failures, surprising defaults, deliberate tradeoffs. Third person: 'Invoke when the agent discovers something that would surprise a cold reader of the code.'"
metadata:
  tags: learnings, knowledge-capture, session-wrap-up, documentation
---

## When to use

- At the end of any session longer than ~30 min that involved a problem, fix, or discovery
- Proactively mid-session when you confirm something non-obvious (don't wait until the end)
- When an approach was tried and failed — dead ends are the most valuable entries
- Skip for trivial sessions: typo fixes, renaming, reading-only sessions with no surprises

## Module map

| Module | INSIGHTS.md |
|--------|-------------|
| client | `client/INSIGHTS.md` |
| server | `server/INSIGHTS.md` |
| reviewer-core | `reviewer-core/INSIGHTS.md` |
| repo-intel | `server/src/modules/repo-intel/INSIGHTS.md` |
| e2e | `e2e/INSIGHTS.md` |

## Workflow

### 1. Identify touched modules

Determine which modules had files read, edited, or discussed this session.

### 2. Extract findings — quality gate

For each touched module, scan the session for findings that pass:

**Capture it if:**
- Behavior contradicts what the code appears to do at first glance
- A constraint or invariant not documented in comments or READMEs
- A gotcha that caused or could cause a bug (silent failure, order dependency, surprising default)
- A deliberate performance or correctness tradeoff was confirmed
- You changed your initial reading of the code based on evidence
- An approach failed — dead ends are the most valuable entries

**Skip it if:**
- Already in a README, CLAUDE.md, or this INSIGHTS.md
- Obvious to anyone reading the relevant code
- Generic ("async can be tricky", "type errors happen")
- Restates what identifiers already say

Tiebreaker: *Would this surprise a contributor reading the code cold?* If no — skip.

### 3. Classify each finding

| Section | What goes here |
|---------|---------------|
| What Works | Pattern or approach confirmed effective |
| What Doesn't Work | Dead end, antipattern, silent failure — never skip this section |
| Codebase Patterns | Project convention or architectural decision |
| Tool & Library Notes | Dependency quirk, version-specific behavior, config surprise |
| Recurring Errors & Fixes | Error seen more than once + confirmed fix |
| Session Notes | One dated summary per session |
| Open Questions | Suspected but not yet confirmed |

### 4. Append entries

Append to the correct section in the correct module's INSIGHTS.md.

**Format:**
```
**YYYY-MM-DD** — <one sentence: what is non-obvious and why it matters> (`path/to/file.ts:line`)
```

**Rules:**
- Append only — never overwrite or delete existing entries
- Always use today's date
- Always include `file:line` when possible
- One entry per distinct finding
- Session Notes: one entry per session summarising what was done and found

### 5. Report

Print a short summary: which files were updated, how many entries per file, which sections. If nothing passed the quality gate, say so explicitly — an empty session is valid.
