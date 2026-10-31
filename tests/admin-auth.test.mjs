import assert from 'node:assert/strict'
import { before, test } from 'node:test'
import { verifyAccessToken } from '../server/utils/access-token.ts'
import { getAdminEmailAllowlist, isAdminEmailAllowed } from '../server/utils/admin-allowlist.ts'

const issuer = 'selamanya.cloudflareaccess.com'
const audience = 'story-admin-audience'
const options = {
  teamDomain: issuer,
  audience,
  allowlist: ['admin@example.com'],
}

let privateKey
let publicJwk

before(async () => {
  const pair = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )
  privateKey = pair.privateKey
  publicJwk = { ...await crypto.subtle.exportKey('jwk', pair.publicKey), kid: 'test-key' }
})

function base64Url(value) {
  return Buffer.from(value).toString('base64url')
}

async function createToken(claimOverrides = {}) {
  const header = base64Url(JSON.stringify({ alg: 'RS256', kid: 'test-key' }))
  const claims = base64Url(JSON.stringify({
    aud: [audience],
    email: 'Admin@Example.com',
    exp: Math.floor(Date.now() / 1000) + 60,
    iss: `https://${issuer}`,
    ...claimOverrides,
  }))
  const content = `${header}.${claims}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(content),
  )
  return `${content}.${base64Url(signature)}`
}

const resolveTestKey = async (_teamDomain, keyId) => {
  assert.equal(keyId, 'test-key')
  return publicJwk
}

test('accepts a signed, unexpired Cloudflare Access token for an allowed admin', async () => {
  assert.equal(
    await verifyAccessToken(await createToken(), options, resolveTestKey),
    'admin@example.com',
  )
})

test('rejects a token with an invalid signature', async () => {
  const token = await createToken()
  const [header, claims, signature] = token.split('.')
  const tamperedSignature = `${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`
  await assert.rejects(
    verifyAccessToken(`${header}.${claims}.${tamperedSignature}`, options, resolveTestKey),
    error => error.statusCode === 401,
  )
})

test('rejects an incorrect issuer, audience, or expired token', async (context) => {
  for (const claims of [
    { iss: 'https://attacker.example' },
    { aud: ['other-audience'] },
    { exp: Math.floor(Date.now() / 1000) - 1 },
  ]) {
    await context.test(JSON.stringify(claims), async () => {
      await assert.rejects(
        verifyAccessToken(await createToken(claims), options, resolveTestKey),
        error => error.statusCode === 401,
      )
    })
  }
})

test('rejects a signed token when its email is not allowlisted', async () => {
  const token = await createToken({ email: 'unknown@example.com' })
  await assert.rejects(
    verifyAccessToken(token, options, resolveTestKey),
    error => error.statusCode === 403,
  )
})

test('allows only normalized email addresses from the admin allowlist', () => {
  const allowlist = getAdminEmailAllowlist(' Admin@Example.com, , owner@example.com ')
  assert.deepEqual(allowlist, ['admin@example.com', 'owner@example.com'])
  assert.equal(isAdminEmailAllowed('ADMIN@example.com', allowlist), true)
  assert.equal(isAdminEmailAllowed('user@example.com', allowlist), false)
})
