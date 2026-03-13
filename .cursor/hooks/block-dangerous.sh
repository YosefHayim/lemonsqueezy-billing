#!/bin/bash
# Cursor beforeShellExecution hook: block dangerous commands.
# Matcher limits to: rm -rf, rm -r, curl, wget, nc

input=$(cat)
command=$(echo "$input" | jq -r '.command // empty')

if echo "$command" | grep -qE 'rm\s+-rf|rm\s+-r\s'; then
  echo '{"permission":"deny","user_message":"Destructive rm command blocked. Use explicit paths and avoid -rf/-r flags.","agent_message":"The rm -rf or rm -r command has been blocked. Use safer alternatives: specify exact paths, avoid recursive flags, or use trash/restore instead."}'
  exit 2
fi

if echo "$command" | grep -qE 'curl\s+|wget\s+|nc\s+'; then
  echo '{"permission":"ask","user_message":"Network command requires approval: '"$(echo "$command" | head -c 80)"'","agent_message":"This network command (curl/wget/nc) requires user approval before execution."}'
  exit 0
fi

echo '{"permission":"allow"}'
exit 0
