export function sanitizeDiagnosticMessage(message: string, secrets: Array<string | undefined> = []): string {
  let safeMessage = message
  for (const secret of secrets) {
    if (secret && secret.length >= 4) safeMessage = safeMessage.replaceAll(secret, '[redacted]')
  }
  return safeMessage
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[redacted]')
    .slice(0, 400)
}
