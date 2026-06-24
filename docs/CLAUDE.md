# CLAUDE.md — Docs and Prompt Specs

Documentation source for reviewer-agent behavior and model/prompt conventions.

## Scope

- Prompt specifications and operating rules for review agents
- Human-maintained prompt docs that map to runtime `agents.system_prompt`

## Primary Docs

- `docs/agent-prompts/README.md` — how prompts are assembled and enforced
- `docs/agent-prompts/general-reviewer.md`
- `docs/agent-prompts/security-reviewer.md`
- `docs/agent-prompts/performance-reviewer.md`
- `docs/agent-prompts/choosing-a-model.md`

## Relationship to Runtime

- Runtime source of truth is database-stored prompt text.
- Files in `docs/agent-prompts/` are reviewable canonical specs and should be kept in sync with DB updates.
- Output structure is schema-enforced in code, not prompt-described.

## Authoring Rules

- Keep severity language aligned with enum values (`CRITICAL`, `WARNING`, `SUGGESTION`).
- Keep verdict semantics explicit and deterministic.
- Prefer precision over quantity and avoid quota-style guidance.
