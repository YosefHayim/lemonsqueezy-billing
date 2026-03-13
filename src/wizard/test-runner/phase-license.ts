import { createLicenseKeyManagement } from '../../core/licenses.js';
import type { TestEnvConfig } from './config.js';
import { LoadingAnimation } from '../components/loading.js';
import { loggedCall } from './logger.js';

export async function runPhaseLicense(
  config: TestEnvConfig,
  loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  if (!config.licenseKey) {
    console.log('Skipped Phase 5: no license key');
    return {};
  }

  const lkm = createLicenseKeyManagement();
  const licenseKey = config.licenseKey;

  try {
    await loggedCall(
      '5.1 getLicenseDetails',
      () => lkm.getLicenseDetails(licenseKey),
      loading
    );
  } catch { /* empty */ }

  try {
    await loggedCall(
      '5.2 activateLicense',
      () => lkm.activateLicense(licenseKey, 'wizard-test-instance'),
      loading
    );
  } catch { /* empty */ }

  try {
    await loggedCall(
      '5.3 validateLicense',
      () => lkm.validateLicense(licenseKey),
      loading
    );
  } catch { /* empty */ }

  try {
    await loggedCall(
      '5.4 deactivateLicense',
      () => lkm.deactivateLicense(licenseKey, 'wizard-test-instance'),
      loading
    );
  } catch { /* empty */ }

  return {};
}
