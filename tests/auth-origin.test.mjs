import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  isLocalAuthHostname,
  isValidAuthBaseURL,
  resolveAuthOrigins,
} from '../server/utils/auth-origin.ts'

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

test('allows an HTTP localhost origin only for a local development request', () => {
  assert.equal(isValidAuthBaseURL('http://localhost:8787'), true)
  assert.equal(resolveAuthOrigins(undefined, 'http://localhost:8787').baseURL, 'http://localhost:8787')
  assert.throws(
    () => resolveAuthOrigins('http://localhost:8787', 'https://stories.example.com'),
    /local requests/,
  )
})

test('requires explicit HTTPS configuration instead of falling back to a public request origin', () => {
  for (const origin of ['http://stories.example.com', 'https://stories.example.com']) {
    assert.throws(
      () => resolveAuthOrigins(undefined, origin),
      /BETTER_AUTH_URL is required/,
    )
  }
  assert.throws(
    () => resolveAuthOrigins('http://stories.example.com', 'https://stories.example.com'),
    /valid HTTPS origin/,
  )
})

test('requires HTTPS for public authentication origins', () => {
  assert.equal(isValidAuthBaseURL('https://stories.example.com'), true)
  assert.equal(isValidAuthBaseURL('http://stories.example.com'), false)
  assert.equal(isValidAuthBaseURL('http://localhost:8787'), true)
  assert.equal(isValidAuthBaseURL('http://127.0.0.1:8787'), true)
})

test('rejects auth base URLs that are not plain origins', () => {
  for (const value of [
    'https://user:password@stories.example.com',
    'https://stories.example.com/auth',
    'https://stories.example.com/?next=/',
    'https://stories.example.com/#auth',
    'not a URL',
  ]) {
    assert.equal(isValidAuthBaseURL(value), false, value)
  }
})

test('recognizes supported local hostnames only', () => {
  assert.equal(isLocalAuthHostname('localhost'), true)
  assert.equal(isLocalAuthHostname('127.0.0.1'), true)
  assert.equal(isLocalAuthHostname('[::1]'), false)
  assert.equal(isLocalAuthHostname('stories.example.com'), false)
})
