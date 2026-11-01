import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveAuthOrigins } from '../server/utils/auth-origin.ts'

test('uses the request port for local auth while preserving both supported loopback hosts', () => {
  assert.deepEqual(
    resolveAuthOrigins('https://localhost:8787', 'https://127.0.0.1:8788'),
    {
      baseURL: 'https://127.0.0.1:8788',
      trustedOrigins: ['https://127.0.0.1:8788', 'https://localhost:8788'],
      allowedHostnames: ['localhost', '127.0.0.1'],
    },
  )
})

test('keeps the configured local origin when request and configured protocols differ', () => {
  const origins = resolveAuthOrigins('https://localhost:8787', 'http://127.0.0.1:8788')
  assert.equal(origins.baseURL, 'https://localhost:8787')
  assert.deepEqual(origins.trustedOrigins, ['https://localhost:8787', 'https://127.0.0.1:8787'])
})

test('does not trust arbitrary origins when production auth URL is configured', () => {
  const origins = resolveAuthOrigins('https://stories.example.com', 'https://127.0.0.1:8788')
  assert.equal(origins.baseURL, 'https://stories.example.com')
  assert.deepEqual(origins.trustedOrigins, ['https://stories.example.com'])
  assert.deepEqual(origins.allowedHostnames, ['stories.example.com'])
})

test('uses the request origin when no explicit auth URL is configured', () => {
  const origins = resolveAuthOrigins(undefined, 'https://127.0.0.1:8788')
  assert.equal(origins.baseURL, 'https://127.0.0.1:8788')
  assert.deepEqual(origins.trustedOrigins, ['https://127.0.0.1:8788', 'https://localhost:8788'])
})
