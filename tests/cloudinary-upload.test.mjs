import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import test from 'node:test'
import {
  cloudinaryImageMimeTypeFromBytes,
  uploadCloudinaryImage,
} from '../server/utils/cloudinary-upload.ts'

globalThis.crypto ??= webcrypto

const credentials = {
  cloudName: 'test-cloud',
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
}
const folder = 'kekasih/owner-folder'
const timestamp = 1_700_000_000
const allowedFormats = 'jpg,jpeg,png,webp'

test('detects supported image types from file signatures', () => {
  assert.equal(cloudinaryImageMimeTypeFromBytes(new Uint8Array([0xff, 0xd8, 0xff])), 'image/jpeg')
  assert.equal(
    cloudinaryImageMimeTypeFromBytes(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/png',
  )
  assert.equal(
    cloudinaryImageMimeTypeFromBytes(new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ])),
    'image/webp',
  )
  assert.equal(cloudinaryImageMimeTypeFromBytes(new Uint8Array([0x00, 0x01, 0x02])), null)
})

test('uploads server-validated bytes with a folder-scoped signature', async () => {
  const fileBytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00]).buffer
  let requestUrl = ''
  let requestOptions

  const url = await uploadCloudinaryImage({
    credentials,
    folder,
    fileBytes,
    mimeType: 'image/jpeg',
    timestamp,
    fetcher: async (target, options) => {
      requestUrl = target
      requestOptions = options
      return Response.json({
        secure_url: `https://res.cloudinary.com/test-cloud/image/upload/v123/${folder}/photo.jpg`,
      })
    },
  })

  const signature = createHash('sha1')
    .update(`allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`)
    .digest('hex')
  const body = requestOptions.body
  assert.equal(requestUrl, 'https://api.cloudinary.com/v1_1/test-cloud/image/upload')
  assert.equal(requestOptions.method, 'POST')
  assert.ok(requestOptions.signal instanceof AbortSignal)
  assert.equal(body.get('file').type, 'image/jpeg')
  assert.equal(body.get('api_key'), credentials.apiKey)
  assert.equal(body.get('folder'), folder)
  assert.equal(body.get('allowed_formats'), allowedFormats)
  assert.equal(body.get('timestamp'), String(timestamp))
  assert.equal(body.get('signature'), signature)
  assert.equal(body.get('api_secret'), null)
  assert.equal(url, `https://res.cloudinary.com/test-cloud/image/upload/v123/${folder}/photo.jpg`)
})

test('rejects a Cloudinary response outside the signed owner folder', async () => {
  await assert.rejects(
    uploadCloudinaryImage({
      credentials,
      folder,
      fileBytes: new Uint8Array([0xff, 0xd8, 0xff]).buffer,
      mimeType: 'image/jpeg',
      fetcher: async () => Response.json({
        secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/other/photo.jpg',
      }),
    }),
    /Cloudinary image upload failed/,
  )
})

test('surfaces provider HTTP and malformed JSON failures', async () => {
  await assert.rejects(
    uploadCloudinaryImage({
      credentials,
      folder,
      fileBytes: new Uint8Array([0xff, 0xd8, 0xff]).buffer,
      mimeType: 'image/jpeg',
      fetcher: async () => Response.json({}, { status: 401 }),
    }),
    /HTTP 401/,
  )
  await assert.rejects(
    uploadCloudinaryImage({
      credentials,
      folder,
      fileBytes: new Uint8Array([0xff, 0xd8, 0xff]).buffer,
      mimeType: 'image/jpeg',
      fetcher: async () => new Response('invalid json'),
    }),
    SyntaxError,
  )
})
