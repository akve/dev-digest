# Conventions Skill — Implementation Plan

## Goal
Ship the end-to-end Conventions flow: extract candidates from repo samples, validate evidence in code, allow approve/reject/edit in UI, and create a `repo-conventions` skill (optionally linked to an agent).

## Phase 1: Contracts and DB
- Extend `ConventionCandidate` contract in both vendor copies:
  - `server/src/vendor/shared/contracts/knowledge.ts`
  - `client/src/vendor/shared/contracts/knowledge.ts`
- Add conventions metadata columns:
  - `category`
  - `evidence_line_start`
  - `evidence_line_end`
- Keep migration generated via Drizzle (`pnpm db:generate`) rather than manual SQL editing.

## Phase 2: Extraction pipeline
- Keep deterministic sampling in backend:
  - config files (`eslint`, `tsconfig`, `prettier` family)
  - top-12 files from `repoIntel.getConventionSamples()`
- Update extractor schema to require:
  - `category`, `rule`, `evidence.file`, `evidence.line_start`, `evidence.line_end?`, `evidence.snippet`, `confidence`
- Use configured cheap model (`resolveFeatureModel(..., "conventions")`).

## Phase 3: Evidence guardrails
- Verify evidence in code before persisting:
  - file path is safe and exists
  - referenced line range exists
  - snippet text appears in referenced lines
- Drop invalid candidates.

## Phase 4: Backend API + skill creation
- Keep/extend:
  - `POST /repos/:repoId/conventions/extract`
  - `GET /repos/:repoId/conventions`
  - `PATCH /repos/:repoId/conventions/:id`
  - `POST /repos/:repoId/conventions/skill`
- Extend skill-creation payload with:
  - editable `body`
  - `enabled`
  - optional `agent_id` for immediate linking through existing agents mechanism.

## Phase 5: UI flow
- Conventions list:
  - show category + evidence path with line range
  - confidence bar + accept/reject/edit
  - accepted counters and `Deselect all`
- Create Skill modal:
  - editable `name`, `description`, `body`
  - `enabled` toggle
  - type shown as `convention`
  - optional `agent_id`
  - token estimate + unsaved indicator

## Testing Steps

## Backend
- `cd server && pnpm typecheck`
- `cd server && pnpm exec vitest run --exclude '**/*.it.test.ts'`
- If DB integration verification is needed:
  - `cd server && pnpm exec vitest run .it.test`

### Backend checks
- Extraction returns candidates with new evidence shape and confidence bounds.
- Invalid evidence candidates are filtered out.
- `PATCH` approve/reject/edit behavior still works.
- Skill creation fails with zero approved conventions.
- Skill creation with `agent_id` links skill to agent.

## Client
- `cd client && pnpm typecheck`
- `cd client && pnpm test`

### Client checks
- Conventions page renders loading/empty/error/success states.
- Accept/reject/edit actions update list correctly.
- Modal allows editing metadata and body.
- `Create skill` sends `body`, `enabled`, optional `agent_id`.

## Manual end-to-end
1. Open `Skills Lab > Conventions` for a cloned repo.
2. Click `Re-scan`.
3. Confirm candidates show evidence with line ranges and confidence.
4. Approve/reject and edit rules.
5. Open `Create skill`, edit body and metadata.
6. Submit and verify created skill appears in Skills Lab.
7. If `agent_id` was provided, verify skill appears in linked agent skills.
