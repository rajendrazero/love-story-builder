import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import test from 'node:test'
import {
  cloudinaryUploadFolder,
  createCloudinaryUploadSignature,
  resolveCloudinaryCredentials,
} from '../server/utils/cloudinary-signature.ts'
import { uploadImageToCloudinary } from '../shared/utils/cloudinary-upload.ts'

globalThis.crypto ??= webcrypto

test('prefers Cloudflare credentials and trims whitespace', () => {
  assert.deepEqual(
    resolveCloudinaryCredentials(
      { cloudName: ' cloudflare-name ', apiKey: ' edge-key ', apiSecret: ' edge-secret ' },
      { cloudName: 'cloudflare-name', apiKey: 'edge-key', apiSecret: 'edge-secret' },
    ),
    { cloudName: 'cloudflare-name', apiKey: 'edge-key', apiSecret: 'edge-secret' },
  )
})

test('uses runtime credentials when Cloudflare values are missing', () => {
  assert.deepEqual(
    resolveCloudinaryCredentials(
      { cloudName: '', apiKey: undefined, apiSecret: '  ' },
      { cloudName: 'runtime-name', apiKey: 'runtime-key', apiSecret: 'runtime-secret' },
    ),
    { cloudName: 'runtime-name', apiKey: 'runtime-key', apiSecret: 'runtime-secret' },
  )
})

test('normalizes numeric API keys from Nuxt runtime config', () => {
  assert.deepEqual(
    resolveCloudinaryCredentials(
      {},
      { cloudName: 'cloud-name', apiKey: 165341413734398, apiSecret: 'runtime-secret' },
    ),
    { cloudName: 'cloud-name', apiKey: '165341413734398', apiSecret: 'runtime-secret' },
  )
})

test('returns null when any required credential is missing', () => {
  assert.equal(
    resolveCloudinaryCredentials(
      { cloudName: 'cloud', apiKey: 'key', apiSecret: '' },
      { cloudName: '', apiKey: 'runtime-key', apiSecret: undefined },
    ),
    null,
  )
})

test('rejects credentials that conflict between Cloudflare and runtime config', () => {
  assert.equal(
    resolveCloudinaryCredentials(
      { cloudName: 'cloud-a', apiKey: 'key', apiSecret: 'secret' },
      { cloudName: 'cloud-b', apiKey: 'key', apiSecret: 'secret' },
    ),
    null,
  )
})

test('creates a Cloudinary-compatible signature and upload response', async () => {
  const credentials = {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    apiSecret: 'test-secret',
  }
  const timestamp = 1_700_000_000
  const source = `folder=${cloudinaryUploadFolder}&timestamp=${timestamp}${credentials.apiSecret}`
  const expectedSignature = createHash('sha1').update(source).digest('hex')

  assert.deepEqual(await createCloudinaryUploadSignature(credentials, timestamp), {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    folder: 'kekasih',
    timestamp,
    signature: expectedSignature,
  })
})

test('uploads the file with all signed parameters and returns only an HTTPS URL', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  const signature = {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    folder: 'kekasih',
    timestamp: 1_700_000_000,
    signature: 'signed-value',
  }
  let requestUrl
  let requestOptions

  const secureUrl = await uploadImageToCloudinary(
    file,
    async () => signature,
    async (url, options) => {
      requestUrl = url
      requestOptions = options
      return Response.json({ secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/photo.jpg' })
    },
  )

  assert.equal(requestUrl, 'https://api.cloudinary.com/v1_1/test-cloud/image/upload')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(requestOptions.body.get('file').name, 'photo.jpg')
  assert.equal(requestOptions.body.get('api_key'), 'test-key')
  assert.equal(requestOptions.body.get('folder'), 'kekasih')
  assert.equal(requestOptions.body.get('timestamp'), '1700000000')
  assert.equal(requestOptions.body.get('signature'), 'signed-value')
  assert.equal(secureUrl, 'https://res.cloudinary.com/test-cloud/image/upload/photo.jpg')
})

test('surfaces Cloudinary errors instead of accepting an unsuccessful upload', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  await assert.rejects(
    uploadImageToCloudinary(
      file,
      async () => ({
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        folder: 'kekasih',
        timestamp: 1_700_000_000,
        signature: 'signed-value',
      }),
      async () => Response.json({ error: { message: 'Invalid signature' } }, { status: 401 }),
    ),
    /Invalid signature/,
  )
})

test('rejects malformed or insecure URLs from a successful upload response', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  const requestSignature = async () => ({
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    folder: 'kekasih',
    timestamp: 1_700_000_000,
    signature: 'signed-value',
  })

  await assert.rejects(
    uploadImageToCloudinary(file, requestSignature, async () => Response.json({ secure_url: 'http://example.test/photo.jpg' })),
    /URL foto yang tidak aman/,
  )
  await assert.rejects(
    uploadImageToCloudinary(file, requestSignature, async () => new Response('not json', { status: 200 })),
    /respons yang tidak valid/,
  )
})
