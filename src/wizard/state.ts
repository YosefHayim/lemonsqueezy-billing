import type { StoreInfo, CachedProduct } from '../types/index.js';

export interface WizardState {
  apiKey: string;
  isSandbox: boolean;
  stores: StoreInfo[];
  selectedStoreIds: string[];
  products: CachedProduct[];
  selectedProductIds: string[];
  webhookUrl?: string;
  webhookEvents: string[];
  cachePath: string;
  webhookSecret: string;
  loggerPath: string;
}
