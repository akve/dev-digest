# CLAUDE.md — Repo Intel Module

Repo indexing subsystem that turns cloned repositories into queryable structure for review-time context.

## Scope

- File discovery + parsing
- Symbol/reference extraction
- Import graph and ranking
- Repo map cache and retrieval facade
- Incremental re-indexing based on content hash

## Primary Docs

- `server/src/modules/repo-intel/README.md` (full module architecture)
- `server/README.md` (server-wide context and route map)
- `README.md` (how repo-intel feeds reviews)

## Key Internal Areas

- `pipeline/full.ts` / `pipeline/incremental.ts`
- `repo-map.ts`
- `rank.ts`
- `service.ts` (public facade)
- DB tables for symbols/references/edges/rank/cache

## External Surface

- `GET /repos/:id/index-state`
- `POST /repos/:id/resync`

## Contracts With Other Parts

- `reviews/run-executor` consumes repo map/rank/callers outputs.
- Prompt assembly receives repo-intel context as untrusted data blocks.
- Features should integrate via `repoIntel.*` facade, not direct pipeline coupling.
