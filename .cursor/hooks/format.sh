#!/bin/bash
# Cursor afterFileEdit hook: run Prettier on edited files.

input=$(cat)
file_path=$(echo "$input" | jq -r '.file_path // empty')

if [ -z "$file_path" ] || [ ! -f "$file_path" ]; then
  exit 0
fi

# Only format supported extensions
case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.md|*.css|*.scss|*.yaml|*.yml)
    if command -v pnpm >/dev/null 2>&1; then
      pnpm exec prettier --write "$file_path" 2>/dev/null || true
    elif command -v npx >/dev/null 2>&1; then
      npx prettier --write "$file_path" 2>/dev/null || true
    fi
    ;;
esac

exit 0
