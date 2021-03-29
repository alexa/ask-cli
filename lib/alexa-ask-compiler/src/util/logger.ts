import chalk from "chalk";

/* tslint:disable:no-console */
class Logger {
  isDebug: boolean;

  constructor() {
    this.isDebug = process.env.DEBUG === "true";
  }

  silly(...message: string[]) {
    console.log(chalk.grey(`silly ${message.join(" ")}`));
  }

  info(...message: string[]) {
    console.log(chalk.white("info") + " " + message.join(" "));
  }

  warn(...message: string[]) {
    console.log(chalk.yellow("warn") + " " + message.join(" "));
  }

  success(...message: string[]) {
    console.log(chalk.bold.green("success") + " " + message.join(" "));
  }

  debug(...message: string[]) {
    if (this.isDebug)
      console.log(chalk.cyan("debug") + " " + message.join(" "));
  }

  error(...message: string[]) {
    console.log(chalk.bgRed("error") + " " + message.join(" "));
  }
}

export const logger = new Logger();
