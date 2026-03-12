import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { BillingLogger, LoggerConfig, EnhancedLoggerConfig, LogLevel, BillingLoggerConfig } from "../types/index.js";

function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = Math.min(3, Math.floor(local.length / 2));
  return `${local.slice(0, visible)}${"*".repeat(local.length - visible)}@${domain}`;
}

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "apiKey" && typeof value === "string") {
      result[key] = maskApiKey(value);
    } else if (key === "email" && typeof value === "string") {
      result[key] = maskEmail(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getLogLevelConfig(level: LogLevel): EnhancedLoggerConfig {
  const baseConfig: EnhancedLoggerConfig = {
    logLevel: level,
    includeRequestResponse: false,
    includeHeaders: false,
    includeBody: false,
    includeQueryParams: false,
    includeResponseTime: true,
    includeStackTrace: false,
  };

  switch (level) {
    case 'minimal':
      return baseConfig;
    case 'standard':
      return {
        ...baseConfig,
        includeRequestResponse: true,
        includeResponseTime: true,
      };
    case 'detailed':
      return {
        ...baseConfig,
        includeRequestResponse: true,
        includeHeaders: true,
        includeBody: true,
        includeQueryParams: true,
        includeResponseTime: true,
      };
    case 'debug':
      return {
        ...baseConfig,
        includeRequestResponse: true,
        includeHeaders: true,
        includeBody: true,
        includeQueryParams: true,
        includeResponseTime: true,
        includeStackTrace: true,
      };
    default:
      return baseConfig;
  }
}

function createFileLogger(config: EnhancedLoggerConfig & LoggerConfig): BillingLogger {
  mkdirSync(dirname(config.filePath!), { recursive: true });

  const write = (entry: Record<string, unknown>) => {
    const line = JSON.stringify(entry) + "\n";
    appendFileSync(config.filePath!, line, "utf-8");
  };

  return { info: write, warn: write, error: write };
}

export function createLogger(config?: BillingLoggerConfig): BillingLogger | undefined {
  if (!config) return undefined;
  
  // Handle enhanced config with logLevel
  if ('logLevel' in config) {
    const enhancedConfig = config as EnhancedLoggerConfig & LoggerConfig;
    const levelConfig = getLogLevelConfig(enhancedConfig.logLevel || 'standard');
    const mergedConfig = { ...enhancedConfig, ...levelConfig };
    
    if ("custom" in mergedConfig && mergedConfig.custom) return mergedConfig.custom;
    if ("filePath" in mergedConfig && mergedConfig.filePath) return createFileLogger(mergedConfig);
    return undefined;
  }
  
  // Handle legacy config
  if ("custom" in config && config.custom) return config.custom;
  if ("filePath" in config && config.filePath) {
    const enhancedConfig: EnhancedLoggerConfig & LoggerConfig = {
      filePath: config.filePath,
      logLevel: 'standard', // Default to standard for backward compatibility
      includeRequestResponse: true,
      includeHeaders: false,
      includeBody: false,
      includeQueryParams: false,
      includeResponseTime: true,
      includeStackTrace: false,
    };
    return createFileLogger(enhancedConfig);
  }
  return undefined;
}

export function withLogger<TArgs extends Record<string, unknown>, TResult>(
  logger: BillingLogger | undefined,
  op: string,
  fn: (args: TArgs) => Promise<TResult>,
  summarizeResult?: (result: TResult) => Record<string, unknown>
): (args: TArgs) => Promise<TResult> {
  if (!logger) return fn;

  return async (args: TArgs): Promise<TResult> => {
    const start = Date.now();
    try {
      const result = await fn(args);
      const durationMs = Date.now() - start;
      const output = summarizeResult ? summarizeResult(result) : {};
      
      // Enhanced logging with request/response details
      const logEntry: Record<string, unknown> = {
        ts: new Date().toISOString(),
        op,
        status: "ok",
        durationMs,
        input: sanitize(args),
        output,
      };

      logger.info(logEntry);
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      const error = err as Error & { cause?: unknown };
      const details = Array.isArray(error.cause) ? error.cause : undefined;
      
      const errorEntry: Record<string, unknown> = {
        ts: new Date().toISOString(),
        op,
        status: "error",
        durationMs,
        error: error.message,
        ...(details ? { details } : {}),
      };

      logger.error(errorEntry);
      throw err;
    }
  };
}
