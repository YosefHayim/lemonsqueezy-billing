import { confirm } from '@inquirer/prompts';

declare const process: {
  platform: string;
  exit: (code?: number) => void;
};

function isExitPromptError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError';
}

function getPlatformOpenCommand(): string {
  switch (process.platform) {
    case 'darwin':
      return 'open';
    case 'win32':
      return 'start';
    default:
      return 'xdg-open';
  }
}

async function openUrl(url: string): Promise<void> {
  const { exec, execFile } = await import('child_process');
  if (process.platform === 'win32') {
    return new Promise((resolve, reject) => {
      exec(`start "" "${url.replace(/"/g, '')}"`, (error) => {
        if (error) reject(error); else resolve();
      });
    });
  }
  const command = getPlatformOpenCommand();
  return new Promise((resolve, reject) => {
    execFile(command, [url], (error) => {
      if (error) reject(error); else resolve();
    });
  });
}

export async function stepCheckoutOptional(checkoutUrl: string): Promise<boolean> {
  try {
    const shouldOpen = await confirm({
      message: 'Would you like to open the checkout URL to test?',
      default: true,
    });

    if (!shouldOpen) {
      return false;
    }

    await openUrl(checkoutUrl);
    console.log(`[+] Opened: ${checkoutUrl}`);

    const completed = await confirm({
      message: 'Have you completed the test checkout?',
      default: false,
    });

    return completed;
  } catch (error) {
    if (isExitPromptError(error)) {
      process.exit(0);
    }
    throw error;
  }
}
