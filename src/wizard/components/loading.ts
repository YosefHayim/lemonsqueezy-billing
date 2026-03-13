declare const process: {
  stdout: { write: (s: string) => void };
};

export class LoadingAnimation {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private dots = 9;
  private chars = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807'];

  start(message: string = "Loading"): void {
    this.stop();
    process.stdout.write(`\n${message} `);

    this.interval = setInterval(() => {
      const char = this.chars[this.frame % this.dots];
      const dots = '.'.repeat(this.frame % this.dots);
      const spaces = ' '.repeat(this.dots - (this.frame % this.dots) - 1);
      process.stdout.write(`\r${message} ${char}${dots}${spaces} `);
      this.frame++;
    }, 80);
  }

  stop(message?: string): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (message) {
      process.stdout.write(`\r${message}\n`);
    } else {
      process.stdout.write('\n');
    }
  }
}
