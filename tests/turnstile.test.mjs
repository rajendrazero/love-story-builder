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
  logger: {
    error() {},
    warn() {},
  },
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

test('rejects invalid and expired Turnstile tokens using server-side verification', async () => {
  const originalFetch = globalThis.fetch
  try {
    for (const errorCode of ['invalid-input-response', 'timeout-or-duplicate']) {
      let verificationUrl = ''
      globalThis.fetch = async (input) => {
        verificationUrl = String(input)
        return Response.json({ success: false, 'error-codes': [errorCode] })
      }

      const result = await middleware.onRequest(
        new Request('https://localhost/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'x-captcha-response': 'invalid-test-token' },
        }),
        context,
      )
      assert.equal(new URL(verificationUrl).hostname, 'challenges.cloudflare.com')
      assert.equal(result?.response.status, 403)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})
