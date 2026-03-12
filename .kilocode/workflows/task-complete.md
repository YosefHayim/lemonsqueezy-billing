# Task Complete Validation

Before considering a task complete:

1. **Detect package manager:** Read `package.json` and lockfiles. Use pnpm if `pnpm-lock.yaml` exists, yarn if `yarn.lock`, npm if `package-lock.json`.
2. **Detect scripts:** Read `package.json` → `scripts`. Run only scripts that exist.
3. **Run validation (if scripts exist):**
   - If `typecheck` exists → run it (e.g. `pnpm typecheck`, `yarn typecheck`, `npm run typecheck`). Fix any type errors.
   - If `build` exists → run it. Fix any build errors.
4. Only then report the task as complete.

If typecheck or build fails, fix the errors and re-run. Do not mark the task complete until all applicable checks pass. Skip steps for scripts that do not exist.
