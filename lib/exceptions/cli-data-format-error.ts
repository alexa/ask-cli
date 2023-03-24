import CliError from "./cli-error";

export class CliDataFormatError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = "CliDataFormatError";

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
}
