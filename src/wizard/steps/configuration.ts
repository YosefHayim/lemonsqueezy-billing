import { input } from '@inquirer/prompts';

declare const process: {
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

export async function stepConfiguration(defaults: {
  cachePath: string;
  webhookSecret: string;
  loggerPath: string;
}): Promise<{ cachePath: string; webhookSecret: string; loggerPath: string }> {
  try {
    const cachePath = await input({
      message: 'Cache file path:',
      default: defaults.cachePath,
    });

    const webhookSecret = await input({
      message: 'Webhook secret:',
      default: defaults.webhookSecret,
    });

    const loggerPath = await input({
      message: 'Logger file path:',
      default: defaults.loggerPath,
    });

    console.log('[+] Configuration saved');
    return {
      cachePath: cachePath || defaults.cachePath,
      webhookSecret: webhookSecret || defaults.webhookSecret,
      loggerPath: loggerPath || defaults.loggerPath,
    };
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
