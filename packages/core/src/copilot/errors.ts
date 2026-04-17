export class CopilotConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CopilotConfigError";
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
