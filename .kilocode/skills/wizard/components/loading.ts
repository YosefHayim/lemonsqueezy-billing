import chalk from "chalk";

// Animation helpers - spinner animation
export class LoadingAnimation {
  private interval: ReturnType<typeof setInterval> | null = null;
  private frame = 0;
  private spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

  start(message: string = "Loading"): void {
    this.stop();
    process.stdout.write(`\n${message} `);
    
    this.interval = setInterval(() => {
      const char = this.spinner[this.frame % this.spinner.length];
      process.stdout.write(`\r${message} ${char}`);
      this.frame++;
    }, 100);
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

export const loading = new LoadingAnimation();