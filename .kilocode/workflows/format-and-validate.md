# Format and Validate

After making code changes:

1. **Detect package manager:** Read `package.json` and lockfiles. Use pnpm if `pnpm-lock.yaml` exists, yarn if `yarn.lock`, npm if `package-lock.json`.
2. **Detect scripts:** Read `package.json` → `scripts`.
3. **Format (if available):**
   - If `format` exists → run it (e.g. `pnpm format`, `yarn format`).
   - Else if `prettier` is a dependency → run `pnpm exec prettier --write` (or yarn/npm equivalent) on modified files.
4. **Validate (if scripts exist):**
   - If `typecheck` exists → run it.
   - If `build` exists → run it.
   - If `lint` exists → run it.

Invoke this workflow when you need to format edited files and validate the codebase before considering work done. Skip steps for scripts or tools that do not exist.
