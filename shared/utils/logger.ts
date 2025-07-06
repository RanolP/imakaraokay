export class Logger {
  constructor(private verbose: boolean = false) {}

  log(message: string) {
    if (this.verbose) {
      console.log(`[LOG] ${message}`);
    }
  }

  error(message: string) {
    console.error(message);
  }
}
