import type { BillingCallbacks } from '../billing/types.js';

export interface BillingLogger {
  info: (entry: Record<string, unknown>) => void;
  warn: (entry: Record<string, unknown>) => void;
  error: (entry: Record<string, unknown>) => void;
}

export type LoggerConfig =
  | { filePath: string; custom?: never }
  | { custom: BillingLogger; filePath?: never };

export type LogLevel = 'minimal' | 'standard' | 'detailed' | 'debug';

export interface EnhancedLoggerConfig {
  logLevel?: LogLevel;
  includeRequestResponse?: boolean;
  includeHeaders?: boolean;
  includeBody?: boolean;
  includeQueryParams?: boolean;
  includeResponseTime?: boolean;
  includeStackTrace?: boolean;
}

export type BillingLoggerConfig = 
  | LoggerConfig 
  | (LoggerConfig & EnhancedLoggerConfig);

export interface DedupBackend {
  isDuplicate: (key: string) => Promise<boolean>;
  markDuplicate: (key: string, ttlMs: number) => Promise<void>;
}

export interface DedupConfig {
  backend?: DedupBackend;
  ttlMs?: number;
}

export interface BillingConfig {
  apiKey: string;
  storeId?: string;
  webhookSecret?: string;
  cachePath?: string;
  cacheTtlMs?: number;
  checkoutExpiresInMs?: number | null;
  logger?: BillingLoggerConfig;
  callbacks: BillingCallbacks;
  dedup?: DedupConfig;
}
