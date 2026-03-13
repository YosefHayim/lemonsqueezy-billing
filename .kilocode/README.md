# Kilo Code Configuration (Portable)

This folder configures Kilo Code for the project. **Copy the entire `.kilocode` folder and `AGENTS.md` to another project** — the agent will detect that project's context and adapt.

## How It Works

1. **Project Detection:** On task start, the agent reads `package.json`, lockfiles, `tsconfig.json`, etc. to infer:
   - Package manager (pnpm, yarn, npm)
   - Available scripts (typecheck, build, format, lint)
   - Project type (TypeScript, Python, Rust, etc.)

2. **Adaptive Rules:** Rules in `.kilocode/rules/` apply only when they match the detected project type (e.g. TypeScript rules only if `tsconfig.json` exists).

3. **Discovery-Based Workflows:** Workflows in `.kilocode/workflows/` detect available scripts and package manager before running commands. No hardcoded `pnpm` or script names.

## Structure

| Path         | Purpose                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------- |
| `rules/`     | Project rules (codestyle, safety, context). Applied based on detected project type.          |
| `workflows/` | Step-by-step automation. Invoke via `/workflow-name.md` in chat.                             |
| `skills/`    | Project-specific skills. **Remove skills that don't apply** when copying to another project. |

## When Copying to a New Project

1. Copy `AGENTS.md` and the entire `.kilocode/` folder.
2. **Skills:** Remove `skills/` subfolders that don't apply (e.g. `neon-postgres` if the project doesn't use Neon). Add project-specific skills as needed.
3. No other changes required — the agent builds context from the new project's files.
