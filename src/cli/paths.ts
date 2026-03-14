import { tmpdir } from "node:os";
import { join } from "node:path";

const PREFIX = "lemonsqueezy-billing";

export const VALIDATE_CACHE_PATH = join(tmpdir(), `${PREFIX}-validate-cache.json`);
export const VALIDATE_LOG_PATH = join(tmpdir(), `${PREFIX}-validate.log`);
export const VALIDATE_LIVE_CACHE_PATH = join(tmpdir(), `${PREFIX}-live-cache.json`);
