# Contributing

Thanks for your interest. This is a small, focused TypeScript package — contributions are welcome as long as they stay within scope.

## Before You Open a PR

Open an issue first. Describe what you want to change and why. This saves everyone time if the direction isn't a fit.

## Setup

```bash
git clone https://github.com/yosefhayim/fresh-squeezy.git
cd fresh-squeezy
pnpm install
```

## Commands

| Command | What it does |
|---|---|
| `pnpm build` | Compiles TypeScript to `dist/` |
| `pnpm typecheck` | Type-checks without emitting files |
| `pnpm clean` | Removes `dist/` |

There's no test runner yet. The primary validation is `typecheck` + `build` passing clean.

## Code Style

- TypeScript strict mode. No `any`, no type assertions unless unavoidable.
- ESM only (`"type": "module"` in package.json).
- No comments in source files. Code should be self-explanatory.
- Each file stays under 200 lines. If it's growing, split it.
- No external runtime dependencies beyond the LS SDK peer dep.

Run `pnpm typecheck && pnpm build` before pushing. Both must pass.

## Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add subscription pause event type
fix: handle missing customer portal URL gracefully
docs: clarify webhook deduplication behavior
refactor: extract retry logic into shared utility
```

Keep commits atomic. One logical change per commit.

## AI Assistance

If you used an AI tool (Claude, Copilot, ChatGPT, etc.) to write or substantially modify code in your PR, say so in the PR description. Something like "drafted with Claude, reviewed and tested manually" is fine. This isn't a disqualifier — it's just transparency.

## License

By contributing, you agree that your changes will be licensed under the MIT License that covers this project.
