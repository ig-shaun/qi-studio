export function formatCompileError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("ANTHROPIC_API_KEY is not set")) {
    return "ANTHROPIC_API_KEY is not set. Add it to apps/studio/.env.local or the deployment secret store, then restart the Studio server.";
  }

  if (
    /^401\b/.test(message) ||
    /status 401\b/i.test(message) ||
    /authentication_error/i.test(message) ||
    /invalid x-api-key/i.test(message)
  ) {
    return "Anthropic authentication failed: the configured ANTHROPIC_API_KEY is invalid or expired. Update apps/studio/.env.local or the deployment secret store, then restart the Studio server.";
  }

  if (/status 400\b/i.test(message) && /model/i.test(message)) {
    return message;
  }

  if (/Anthropic API request failed with status/i.test(message)) {
    return message;
  }

  if (/^Could not reach Anthropic:/i.test(message)) {
    return message;
  }

  if (/connection error/i.test(message)) {
    return "Could not reach Anthropic from the Studio server. Check network access and the ANTHROPIC_API_KEY configuration.";
  }

  return message;
}
