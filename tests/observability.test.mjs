import assert from 'node:assert/strict'
import test from 'node:test'
import { sanitizeDiagnosticMessage } from '../server/utils/diagnostic-sanitizer.ts'
import { createRequestId } from '../server/utils/request-id.ts'

test('exposes a validated Cloudflare request ID for log correlation', () => {
  assert.equal(createRequestId('ray-123-KUL'), 'ray-123-KUL')
})

test('does not trust malformed Cloudflare request IDs', () => {
  const requestId = createRequestId('bad\r\nheader')
  assert.match(requestId, /^[0-9a-f-]{36}$/)
})

test('diagnostic messages redact secrets, emails, URLs, and long tokens', () => {
  const message = 'Token abc-secret-value rejected for user@example.com at https://provider.example/error?token=hidden abcdefghijklmnopqrstuvwxyz0123456789'
  const safe = sanitizeDiagnosticMessage(message, ['abc-secret-value'])

  assert.equal(safe.includes('abc-secret-value'), false)
  assert.equal(safe.includes('user@example.com'), false)
  assert.equal(safe.includes('https://'), false)
  assert.equal(safe.includes('token=hidden'), false)
  assert.equal(safe.includes('abcdefghijklmnopqrstuvwxyz0123456789'), false)
  assert.match(safe, /\[redacted\]/)
  assert.match(safe, /\[email\]/)
  assert.match(safe, /\[url\]/)
})

test('diagnostic messages have a bounded length', () => {
  assert.equal(sanitizeDiagnosticMessage('ordinary error '.repeat(60)).length, 400)
})
