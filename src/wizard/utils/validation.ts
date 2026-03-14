import type { LoadingAnimation } from '../components/loading.js';
import { WIZARD_CONFIG_FILE } from '../../core/paths.js';

declare const process: {
  cwd: () => string;
  exit: (code?: number) => void;
};

export async function runValidationTests(loading: LoadingAnimation): Promise<void> {
  console.log('\nRunning validation tests...');

  try {
    const { execSync } = await import('child_process');
    const fs = await import('node:fs');
    const path = await import('node:path');

    loading.start('Testing TypeScript compilation');
    execSync('pnpm typecheck', { stdio: 'pipe' });
    loading.stop('[+] TypeScript compilation passed');

    loading.start('Testing build process');
    execSync('pnpm build', { stdio: 'pipe' });
    loading.stop('[+] Build process passed');

    loading.start('Testing billing configuration');
    const configPath = path.resolve(process.cwd(), WIZARD_CONFIG_FILE);

    if (!fs.existsSync(configPath)) {
      throw new Error(`${WIZARD_CONFIG_FILE} file not found`);
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    if (!configContent.includes('export const billingConfig')) {
      throw new Error('billing-config.ts does not export billingConfig');
    }

    loading.stop('[+] Billing configuration valid');

    console.log('\n[+] All validation tests passed!');
    console.log('Your billing integration is ready to use.');
  } catch (error) {
    console.log('\n[x] Validation tests failed:');
    console.error('Error:', error instanceof Error ? error.message : error);
    console.log('\nPlease review the generated files and fix any issues.');
    console.log('You can run the following commands to debug:');
    console.log('  pnpm typecheck');
    console.log('  pnpm build');
    process.exit(1);
  }
}
