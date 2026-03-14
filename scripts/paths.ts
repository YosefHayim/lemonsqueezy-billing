import { tmpdir } from "node:os";
import { join } from "node:path";

const PREFIX = "lemonsqueezy-billing";

export const CLI_TEST_CACHE_PATH = join(tmpdir(), `${PREFIX}-cli-test-cache.json`);
export const CLI_TEST_LOG_PATH = join(tmpdir(), `${PREFIX}-cli-test.log`);

export const CHANGELOG_STATE_FILE = ".ls-changelog-state.md";
export const CHANGELOG_DOCS_DIR = "changelog";
