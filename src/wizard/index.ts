export { runGrimoireWizard as runWizard } from './grimoire-wizard.js';

export class BillingWizard {
  async run(): Promise<void> {
    await (await import('./grimoire-wizard.js')).runGrimoireWizard();
  }
}
