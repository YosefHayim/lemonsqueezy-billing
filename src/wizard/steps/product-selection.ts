import type { CachedProduct } from '../../types/index.js';
import { fetchProducts, flattenPlans } from '@core/plans.js';
import { LoadingAnimation } from '../components/loading.js';
import { checkbox } from '@inquirer/prompts';

declare const process: {
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

export async function stepProductSelection(
  selectedStoreIds: string[],
  loading: LoadingAnimation
): Promise<{ products: CachedProduct[]; selectedProductIds: string[] }> {
  loading.start('Fetching products');

  const allProducts: CachedProduct[] = [];

  for (const storeId of selectedStoreIds) {
    try {
      const products = await fetchProducts(storeId);
      allProducts.push(...products);
    } catch {
      loading.stop(`[x] Failed to fetch products for store ${storeId}`);
      return { products: [], selectedProductIds: [] };
    }
  }

  loading.stop('');

  if (allProducts.length === 0) {
    console.log('[x] No products found. Please create products in your Lemon Squeezy dashboard.');
    return { products: [], selectedProductIds: [] };
  }

  const plans = flattenPlans(allProducts);

  if (plans.length === 0) {
    console.log('[x] No product variants found. Create at least one product variant in your Lemon Squeezy dashboard.');
    return { products: allProducts, selectedProductIds: [] };
  }

  try {
    while (true) {
      const selectedProductIds = await checkbox({
        message: 'Select products to include:',
        choices: plans.map((plan, i) => ({
          name: `${plan.name} - ${plan.variantName} (${plan.priceFormatted})`,
          value: plan.variantId,
          checked: i === 0,
        })),
      });

      if (selectedProductIds.length === 0) {
        console.log('[x] Please select at least one product');
        continue;
      }

      console.log(`[+] Selected ${selectedProductIds.length} product(s)`);
      return { products: allProducts, selectedProductIds };
    }
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
