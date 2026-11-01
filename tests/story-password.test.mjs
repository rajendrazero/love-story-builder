import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import test from 'node:test'
import { hashStoryPassword, verifyStoryPassword } from '../server/utils/story-password.ts'

globalThis.crypto ??= webcrypto

test('hashes and verifies story passwords within the Workers PBKDF2 limit', async () => {
  const credentials = await hashStoryPassword('safe story password')

  assert.match(credentials.salt, /^[a-f0-9]{32}$/)
  assert.match(credentials.hash, /^[a-f0-9]{64}$/)
  assert.equal(await verifyStoryPassword('safe story password', credentials.salt, credentials.hash), true)
  assert.equal(await verifyStoryPassword('incorrect password', credentials.salt, credentials.hash), false)
})
