import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { WizardState } from '../state.js';
import { generateConfigContent } from '../utils/config-content.js';
import { generateExampleContent } from '../utils/example-content.js';
import { runValidationTests } from '../utils/validation.js';
import { LoadingAnimation } from '../components/loading.js';
import { confirm } from '@inquirer/prompts';

declare const process: {
  cwd: () => string;
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

export async function stepGenerateFiles(
  state: WizardState,
  loading: LoadingAnimation
): Promise<void> {
  try {
    const shouldGenerate = await confirm({
      message: 'Generate configuration files?',
      default: true,
    });

    if (!shouldGenerate) {
      console.log('[-] Exiting without generating files');
      return;
    }

    const configContent = generateConfigContent(state);
    const exampleContent = generateExampleContent(state);

    const configPath = resolve(process.cwd(), 'billing-config.ts');
    const examplePath = resolve(process.cwd(), 'example.ts');

    await Promise.all([
      writeFile(configPath, configContent, 'utf8'),
      writeFile(examplePath, exampleContent, 'utf8'),
    ]);

    console.log('\n[+] Files generated successfully!');
    console.log(`    ${configPath}`);
    console.log(`    ${examplePath}`);

    console.log('\nNext steps:');
    console.log('1. Review the generated files');
    console.log('2. Run: npx tsx example.ts');
    console.log('3. Start building your billing integration!');

    await runValidationTests(loading);
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
