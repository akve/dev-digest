#!/usr/bin/env bash
# Stop hook — triggers the engineering-insights wrap-up at session end.
#
# asyncRewake mode: when this script exits with code 2, Claude Code wakes
# the model and prepends this script's stdout as a system message. Claude
# then runs /engineering-insights and writes findings to INSIGHTS.md.
#
# Exits 0 (silently) if the session touched no project files worth capturing.

# Always trigger — let /engineering-insights decide if there's anything to write.
# It will report "nothing to write" if the session had no qualifying findings.
echo "Session ended. Run /engineering-insights now: review this session, extract non-obvious findings, and append them to the relevant INSIGHTS.md files. This step is required — do not skip it."

exit 2
