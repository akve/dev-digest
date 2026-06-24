#!/usr/bin/env bash
# Stop hook — triggers the engineering-insights wrap-up at session end.
#
# asyncRewake mode: when this script exits with code 2, Claude Code wakes
# the model and prepends this script's stdout as a system message. Claude
# then runs /engineering-insights and writes findings to INSIGHTS.md.
#
# Exits 0 (silently) if the session touched no project files worth capturing.

BASE="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Only trigger when source files have uncommitted changes — skip for doc-only or rename-only sessions.
SOURCE_CHANGED=$(git -C "$BASE" status --porcelain 2>/dev/null \
  | awk '{print $NF}' \
  | grep -E '\.(ts|tsx|js|jsx|sh|sql)$' \
  | head -1)

[ -z "$SOURCE_CHANGED" ] && exit 0

echo "Session ended. Run /engineering-insights now: review this session, extract non-obvious findings, and append them to the relevant INSIGHTS.md files. This step is required — do not skip it."

exit 2
