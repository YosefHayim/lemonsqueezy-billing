import prompts from "prompts";
import chalk from "chalk";
import { WizardState, PromptState } from "@wizard/types.js";
import { loading } from "@wizard/components/loading.js";

export async function stepStoreSelection(state: WizardState): Promise<void> {
  console.log("\n" + chalk.dim("Navigation: ENTER to proceed, ESC to go back"));
  if (state.stores.length === 0) {
    console.log("[x] No stores found. Please check your API key.");
    return; // This should trigger the API key step again in the main flow
  }

  console.log("\n" + chalk.dim("Select stores (use SPACE to select, ENTER to submit):"));
  const response = await prompts({
    type: "multiselect",
    name: "stores",
    message: "Select stores to use:",
    choices: state.stores.map(store => ({
      title: `${store.name} (${store.id})`,
      value: store.id
    })),
    instructions: false,
    hint: "Space to select, Enter to submit",
    onState: (state: PromptState) => {
      if (state.aborted) throw new Error('Aborted');
    }
  });

  state.selectedStoreIds = response.stores;

  if (state.selectedStoreIds.length === 0) {
    console.log("[x] Please select at least one store");
    return stepStoreSelection(state);
  }

  console.log(`[+] Selected ${state.selectedStoreIds.length} store(s)`);
}