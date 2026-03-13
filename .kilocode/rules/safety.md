# Safety & Restricted Operations

## Commands to Avoid

Do NOT run these commands. If the user or task suggests them, refuse and explain why:

- **Force push to main/master:** `git push --force` to `main` or `master` — never force-push to protected branches
- **Recursive delete from root:** `rm -rf /` or `rm -rf` with root path — destructive and irreversible
- **sudo:** `sudo` commands — requires elevated privileges; ask the user to run manually
- **curl | bash:** `curl ... | bash` or `curl ... | sh` — piping remote scripts to shell is unsafe
- **Package install from URL/git:** `npm install`, `pnpm add`, or `yarn add` with `https://`, `git+`, or `github:` URLs — use registry packages only

## File Conventions

- **TypeScript projects:** If `tsconfig.json` exists — use `.ts` files, not `.js`. Do not create or write to `.js` files in TypeScript projects.
- **Auto-generated files:** Files in `dist/`, `build/`, `out/`, or containing `.generated` in the path, are typically auto-generated. Edits may be overwritten. Note this when reading or editing them.

## Restricted File Access

Do NOT read these files — they contain sensitive data:

- `.env`
- `.env.*` (e.g. `.env.local`, `.env.production`)
- `credentials.json`
- `supersecrets.txt`
- Any file explicitly listed as containing secrets or credentials

## Network Commands

Before running `curl`, `wget`, or `nc` (netcat), ask the user for approval. These commands can access external resources and should be confirmed before execution.
