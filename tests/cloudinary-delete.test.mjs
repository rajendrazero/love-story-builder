import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import test from 'node:test'
import { destroyCloudinaryImage } from '../server/utils/cloudinary-delete.ts'

globalThis.crypto ??= webcrypto

const credentials = {
  cloudName: 'test-cloud',
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
}

test('signs and requests a Cloudinary image deletion without exposing the API secret', async () => {
  const timestamp = 1_700_000_000
  const publicId = 'kekasih/owner-hash/photo'
  let requestUrl = ''
  let requestOptions

  await destroyCloudinaryImage({
    credentials,
    publicId,
    timestamp,
    fetcher: async (url, options) => {
      requestUrl = url
      requestOptions = options
      return Response.json({ result: 'ok' })
    },
  })

  const signature = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${credentials.apiSecret}`)
    .digest('hex')
  const body = requestOptions.body
  assert.equal(requestUrl, 'https://api.cloudinary.com/v1_1/test-cloud/image/destroy')
  assert.equal(requestOptions.method, 'POST')
  assert.ok(requestOptions.signal instanceof AbortSignal)
  assert.equal(body.get('api_key'), credentials.apiKey)
  assert.equal(body.get('public_id'), publicId)
  assert.equal(body.get('timestamp'), String(timestamp))
  assert.equal(body.get('signature'), signature)
  assert.doesNotMatch(body.toString(), /test-api-secret/)
})

test('treats a previously deleted Cloudinary asset as an idempotent success', async () => {
  await assert.doesNotReject(
    destroyCloudinaryImage({
      credentials,
      publicId: 'kekasih/owner-hash/removed',
      timestamp: 1_700_000_000,
      fetcher: async () => Response.json({ result: 'not found' }),
    }),
  )
})

test('surfaces provider and malformed-response failures', async () => {
  await assert.rejects(
    destroyCloudinaryImage({
      credentials,
      publicId: 'kekasih/owner-hash/photo',
      fetcher: async () => Response.json({ result: 'error' }, { status: 401 }),
    }),
    /HTTP 401/,
  )
  await assert.rejects(
    destroyCloudinaryImage({
      credentials,
      publicId: 'kekasih/owner-hash/photo',
      fetcher: async () => new Response('invalid json'),
    }),
    SyntaxError,
  )
})
