import assert from 'node:assert/strict'
import { test } from 'node:test'
import { captcha } from 'better-auth/plugins'

const middleware = captcha({
  provider: 'cloudflare-turnstile',
  secretKey: 'test-secret',
  endpoints: ['/sign-up/email', '/sign-in/email', '/request-password-reset'],
  allowedHostnames: ['localhost'],
})

const context = {
  options: { basePath: '/api/auth' },
  logger: { error() {} },
}

test('rejects protected auth requests when no Turnstile response is present', async () => {
  const result = await middleware.onRequest(
    new Request('https://localhost/api/auth/sign-in/email', { method: 'POST' }),
    context,
  )

  assert.equal(result?.response.status, 400)
})

test('does not apply the auth challenge to unrelated session reads', async () => {
  const result = await middleware.onRequest(
    new Request('https://localhost/api/auth/get-session'),
    context,
  )

  assert.equal(result, undefined)
})
