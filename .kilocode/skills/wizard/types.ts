// Global type declarations for Node.js and modules
declare const process: {
  argv: string[];
  cwd: () => string;
  stdout: { write: (s: string) => void };
  exit: (code?: number) => void;
  env: Record<string, string | undefined>;
};

declare namespace NodeJS {
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}

// Types for prompts
export interface PromptState {
  aborted: boolean;
  submitted: boolean;
}

export interface WizardState {
  apiKey: string;
  stores: any[];
  selectedStoreIds: string[];
  products: any[];
  selectedProductIds: string[];
  webhookUrl?: string;
  webhookEvents: string[];
  cachePath: string;
  webhookSecret: string;
  loggerPath: string;
}

export interface AvailableApiKey {
  name: string;
  value: string;
  description: string;
}