declare const process: {
  stdout: { write: (s: string) => void };
};

export class LoadingAnimation {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private chars = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807'];
  private readonly charCount = this.chars.length;

  start(message: string = "Loading"): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    process.stdout.write(`\n${message} `);

    this.interval = setInterval(() => {
      const char = this.chars[this.frame % this.charCount];
      process.stdout.write(`\r${message} ${char} `);
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
