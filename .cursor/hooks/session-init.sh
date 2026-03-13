#!/bin/bash
# Cursor sessionStart hook: inject .cursorrules as additional_context.
# Migrated from .clinerules/hooks/TaskStart (Cline format).

input=$(cat)
workspace_root="${CURSOR_PROJECT_DIR:-}"
[ -z "$workspace_root" ] && workspace_root=$(echo "$input" | jq -r '.workspace_roots[0] // empty')
[ -z "$workspace_root" ] && workspace_root=$(cd "$(dirname "$0")/../.." && pwd)
[ -z "$workspace_root" ] && workspace_root="$PWD"

cursorrules_path="${workspace_root}/.cursorrules"

if [ -f "$cursorrules_path" ]; then
  content=$(cat "$cursorrules_path")
  additional_context=$(echo "$content" | jq -Rs '.')
  echo "{\"additional_context\":${additional_context}}"
else
  echo '{}'
fi
