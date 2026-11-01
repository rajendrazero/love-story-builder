import { getHeader, getRequestURL, setResponseHeader, type H3Event } from 'h3'
import { sanitizeDiagnosticMessage } from './diagnostic-sanitizer'
import { createRequestId } from './request-id'

export function getRequestId(event: H3Event): string {
  const requestId = createRequestId(getHeader(event, 'cf-ray'))
  setResponseHeader(event, 'X-Request-ID', requestId)
  return requestId
}

export function logOperationalError(
  event: H3Event,
  name: string,
  error: unknown,
  context: Record<string, string | number | boolean> = {},
  secrets: Array<string | undefined> = [],
): void {
  const url = getRequestURL(event)
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const safeContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      typeof value === 'string' ? sanitizeDiagnosticMessage(value, secrets) : value,
    ]),
  )
  console.error(JSON.stringify({
    ...safeContext,
    severity: 'error',
    event: name,
    requestId: getRequestId(event),
    path: sanitizeDiagnosticMessage(url.pathname, secrets),
    error: sanitizeDiagnosticMessage(errorMessage, secrets),
  }))
}
