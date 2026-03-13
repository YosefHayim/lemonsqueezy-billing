# Changelog Monitoring

The `monitor-changelog.yml` workflow runs daily at 12:00 UTC and opens a pull request whenever the [Lemon Squeezy API changelog](https://docs.lemonsqueezy.com/api/getting-started/changelog) publishes a new entry.

## How it works

1. `scripts/monitor-ls-changelog.ts` fetches the changelog page and extracts the latest entry using a three-strategy selector chain.
2. The extracted content is compared against `.ls-changelog-state.md` (date + content hash on line 1, full changelog table below).
3. On a change, `LLM_TASK.md` is written and a pull request is opened via `peter-evans/create-pull-request`.
4. The state file is committed as part of the PR so subsequent runs know the last-seen entry.

## Required repository permissions

The workflow uses `GITHUB_TOKEN` with `contents: write` and `pull-requests: write`. These permissions are declared in the workflow file.

By default, GitHub Actions tokens are read-only on new repositories. Enable write access once:

**Settings → Actions → General → Workflow permissions → Read and write permissions → Save**

Without this, the `Create pull request` step will fail with a 403 error.

## Selector maintenance

If the `Warn on scraper failure` step fires in CI, the LS docs page DOM has changed. Update `extractLatestEntry` in `scripts/monitor-ls-changelog.ts`:

- **Strategy 1** targets `ol.relative.isolate li` (Mintlify changelog list)
- **Strategy 2** targets any `h2` matching a month-date pattern with following `ul`/`p` siblings
- **Strategy 3** falls back to regex scanning the body text

Inspect the live page with browser DevTools and update the primary selector to match the new structure.

## Bootstrapping after a reset

If `.ls-changelog-state.md` is deleted or the repo is cloned fresh, the first workflow run writes the current changelog state without opening a PR. Subsequent runs detect changes normally.
