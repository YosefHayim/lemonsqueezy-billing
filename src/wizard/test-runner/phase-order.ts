import { LoadingAnimation } from '../components/loading.js';
import type { TestEnvConfig } from './config.js';

export async function runPhaseOrder(
  _config: TestEnvConfig,
  _loading: LoadingAnimation
): Promise<Partial<TestEnvConfig>> {
  return {};
}
