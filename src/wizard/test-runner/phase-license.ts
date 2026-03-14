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
      async () => {
        const result = await lkm.getLicenseDetails(licenseKey);
        if (!result) throw new Error('License details returned null');
        return result;
      },
      loading
    );
  } catch { /* empty */ }

  let activatedInstanceId: string | undefined;

  try {
    await loggedCall(
      '5.2 activateLicense',
      async () => {
        const result = await lkm.activateLicense(licenseKey, 'wizard-test-instance');
        if (!result.activated) throw new Error('License activation returned false');
        activatedInstanceId = result.instanceId;
        return result;
      },
      loading
    );
  } catch { /* empty */ }

  try {
    await loggedCall(
      '5.3 validateLicense',
      async () => {
        const result = await lkm.validateLicense(licenseKey);
        if (!result.valid) throw new Error('License validation returned invalid');
        return result;
      },
      loading
    );
  } catch { /* empty */ }

  try {
    await loggedCall(
      '5.4 deactivateLicense',
      async () => {
        if (!activatedInstanceId) {
          throw new Error('No instanceId from activation — skipping deactivation');
        }
        const result = await lkm.deactivateLicense(licenseKey, activatedInstanceId);
        if (!result) throw new Error('License deactivation returned false');
        return result;
      },
      loading
    );
  } catch { /* empty */ }

  return {};
}
