import prompts from "prompts";
import chalk from "chalk";
import { WizardState, PromptState } from "@wizard/types.js";
import { fetchProducts, flattenPlans } from "@core/plans.js";
import { loading } from "@wizard/components/loading.js";

export async function stepProductSelection(state: WizardState): Promise<void> {
  console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
  
  loading.start("Fetching products");
  
  const allProducts: any[] = [];

  for (const storeId of state.selectedStoreIds) {
    try {
      const products = await fetchProducts(storeId);
      allProducts.push(...products);
    } catch (error) {
      loading.stop("[x] Failed to fetch products for store " + storeId);
      return; // This should trigger the store selection step again in the main flow
    }
  }

  if (allProducts.length === 0) {
    loading.stop("[x] No products found. Please create products in your Lemon Squeezy dashboard.");
    return; // This should trigger the store selection step again in the main flow
  }

  state.products = allProducts;
  const plans = flattenPlans(allProducts);

  loading.stop(`[+] Found ${plans.length} products available`);

  console.log("\n" + chalk.dim("Select products (use SPACE to select, ENTER to submit):"));
  const response = await prompts({
    type: "multiselect",
    name: "products",
    message: "Select products to include:",
    choices: plans.map(plan => ({
      title: `${plan.name} - ${plan.variantName} (${plan.priceFormatted})`,
      value: plan.variantId
    })),
    instructions: false,
    hint: "Space to select, Enter to submit",
    onState: (state: PromptState) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  state.selectedProductIds = response.products;

  if (state.selectedProductIds.length === 0) {
    console.log("[x] Please select at least one product");
    return stepProductSelection(state);
  }

  console.log(`[+] Selected ${state.selectedProductIds.length} product(s)`);
}