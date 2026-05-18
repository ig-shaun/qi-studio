export class CopilotConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopilotConfigError";
  }
}

export class CopilotConnectionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "CopilotConnectionError";
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class CopilotRequestError extends Error {
  readonly status: number;
  readonly body: string;

  constructor(status: number, body: string) {
    super(`Anthropic API request failed with status ${status}: ${body}`);
    this.name = "CopilotRequestError";
    this.status = status;
    this.body = body;
  }
}

export class CopilotOutputError extends Error {
  readonly raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.name = "CopilotOutputError";
    this.raw = raw;
  }
}
