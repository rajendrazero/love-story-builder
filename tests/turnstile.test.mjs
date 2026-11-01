import assert from 'node:assert/strict'
import { test } from 'node:test'
import { captcha } from 'better-auth/plugins'

const middleware = captcha({
  provider: 'cloudflare-turnstile',
  secretKey: 'test-secret',
  endpoints: [
    '/sign-up/email',
    '/sign-in/email',
    '/request-password-reset',
    '/send-verification-email',
  ],
  allowedHostnames: ['localhost'],
})

const context = {
  options: { basePath: '/api/auth' },
  logger: { error() {} },
}

test('rejects protected auth requests when no Turnstile response is present', async () => {
  for (const path of ['/sign-in/email', '/request-password-reset', '/send-verification-email']) {
    const result = await middleware.onRequest(
      new Request(`https://localhost/api/auth${path}`, { method: 'POST' }),
      context,
    )
    assert.equal(result?.response.status, 400, `${path} should require Turnstile`)
  }
})

test('does not require another CAPTCHA after a user proves email ownership with a reset token', async () => {
  const result = await middleware.onRequest(
    new Request('https://localhost/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'single-use-email-token', newPassword: 'a-secure-new-password' }),
    }),
    context,
  )

  assert.equal(result, undefined)
})

test('does not apply the auth challenge to unrelated session reads', async () => {
  const result = await middleware.onRequest(
    new Request('https://localhost/api/auth/get-session'),
    context,
  )

  assert.equal(result, undefined)
})
