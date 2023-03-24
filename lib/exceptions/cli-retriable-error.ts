import CliError from "./cli-error";

export class CliRetriableError extends CliError {
  constructor(message: string) {
    super(message);
    this.name = "CliRetriableError";

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
}

export class RetriableServiceError extends CliRetriableError {
  protected readonly payload: any;

  constructor(message: string, body?: any) {
    super(message);
    this.name = "RetriableServiceError";
    this.payload = body;

    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }
}
