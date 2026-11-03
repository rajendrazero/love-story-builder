import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addInlineScriptNonces,
  createContentSecurityPolicy,
  createCspNonce,
} from '../server/utils/content-security-policy.ts'

test('creates unique cryptographic nonces for response policies', () => {
  const first = createCspNonce()
  const second = createCspNonce()

  assert.match(first, /^[A-Za-z0-9+/]{22}==$/)
  assert.notEqual(first, second)
})

test('CSP restricts scripts while allowing required app and integration origins', () => {
  const policy = createContentSecurityPolicy('test-nonce')

  assert.match(policy, /default-src 'self'/)
  assert.match(policy, /script-src 'self' 'nonce-test-nonce' https:\/\/challenges\.cloudflare\.com/)
  assert.match(policy, /object-src 'none'/)
  assert.match(policy, /frame-ancestors 'none'/)
  assert.match(policy, /connect-src[^;]*https:\/\/api\.cloudinary\.com/)
  assert.match(policy, /frame-src 'self' https:\/\/challenges\.cloudflare\.com/)
  assert.doesNotMatch(policy, /frame-src[^;]*(?:spotify|youtube|soundcloud)/i)
  assert.doesNotMatch(policy, /script-src[^;]*unsafe-inline/)
})

test('adds CSP nonces only to inline scripts in all rendered HTML segments', () => {
  const html = {
    head: ['<script type="importmap">{}</script>'],
    body: [
      '<script>bootstrap()</script>',
      '<script src="/_nuxt/app.js"></script>',
      '<script nonce="existing">existing()</script>',
    ],
    bodyAppend: ['<script type="application/json">{}</script>'],
  }

  addInlineScriptNonces(html, 'request-nonce')

  assert.match(html.head[0], /<script nonce="request-nonce" type="importmap">/)
  assert.match(html.body[0], /<script nonce="request-nonce">/)
  assert.equal(html.body[1], '<script src="/_nuxt/app.js"></script>')
  assert.equal(html.body[2], '<script nonce="existing">existing()</script>')
  assert.match(html.bodyAppend[0], /<script nonce="request-nonce" type="application\/json">/)
})
