#!/usr/bin/env bash
# UserPromptSubmit hook — injects INSIGHTS.md content as session context.
# Runs before every user prompt. Outputs JSON with additionalContext so Claude
# knows past findings before starting work. Silent (exits 0) when files are empty.

BASE="${CLAUDE_PROJECT_DIR:-$(pwd)}"

TMPFILE=$(mktemp /tmp/learnings-XXXXXX.txt)
trap 'rm -f "$TMPFILE"' EXIT

HAS_CONTENT=false
for rel in \
  "client/INSIGHTS.md" \
  "server/INSIGHTS.md" \
  "reviewer-core/INSIGHTS.md" \
  "e2e/INSIGHTS.md" \
  "server/src/modules/repo-intel/INSIGHTS.md"; do
  f="$BASE/$rel"
  # Only inject if the file has at least one dated entry (**YYYY-MM-DD**)
  if [ -f "$f" ] && grep -qE '^\*\*[0-9]{4}-[0-9]{2}-[0-9]{2}\*\*' "$f" 2>/dev/null; then
    printf "### %s\n" "$rel" >> "$TMPFILE"
    cat "$f" >> "$TMPFILE"
    printf "\n" >> "$TMPFILE"
    HAS_CONTENT=true
  fi
done

[ "$HAS_CONTENT" = false ] && exit 0

python3 - "$TMPFILE" <<'PY'
import sys, json

with open(sys.argv[1]) as fh:
    body = fh.read()

header = (
    "=== ENGINEERING INSIGHTS (past session findings) ===\n"
    "Before starting work, identify which modules you will touch and state the top 3 "
    "most relevant points from their INSIGHTS.md sections.\n\n"
)

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": header + body
    }
}))
PY
