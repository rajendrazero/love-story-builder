import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import test from 'node:test'
import {
  cloudinaryUploadFolderForOwner,
  cloudinaryUploadFolder,
  createCloudinaryUploadSignature,
  resolveCloudinaryCredentials,
} from '../server/utils/cloudinary-signature.ts'
import { uploadImageToCloudinary } from '../shared/utils/cloudinary-upload.ts'
import {
  ALLOWED_CLOUDINARY_IMAGE_FORMATS,
  MAX_CLOUDINARY_IMAGE_SIZE,
} from '../shared/utils/cloudinary-upload-policy.ts'

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
  const folder = `${cloudinaryUploadFolder}/owner-folder`
  const allowedFormats = ALLOWED_CLOUDINARY_IMAGE_FORMATS.join(',')
  const source = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`
  const expectedSignature = createHash('sha1').update(source).digest('hex')

  assert.deepEqual(await createCloudinaryUploadSignature(credentials, timestamp, folder), {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    folder,
    allowedFormats,
    timestamp,
    signature: expectedSignature,
  })
})

test('creates distinct non-reversible upload folders for each owner', async () => {
  const firstOwnerFolder = await cloudinaryUploadFolderForOwner('owner-1')
  const secondOwnerFolder = await cloudinaryUploadFolderForOwner('owner-2')

  assert.match(firstOwnerFolder, /^kekasih\/[a-f0-9]{64}$/)
  assert.notEqual(firstOwnerFolder, secondOwnerFolder)
})

test('uploads the file through the authenticated application endpoint', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  let requestUrl
  let requestOptions

  const secureUrl = await uploadImageToCloudinary(
    file,
    async (url, options) => {
      requestUrl = url
      requestOptions = options
      return Response.json({ url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/owner-folder/photo.jpg' })
    },
  )

  assert.equal(requestUrl, '/api/uploads/image')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(requestOptions.body.get('file').name, 'photo.jpg')
  assert.equal(secureUrl, 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/owner-folder/photo.jpg')
})

test('surfaces application upload errors instead of accepting an unsuccessful upload', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  await assert.rejects(
    uploadImageToCloudinary(file, async () => Response.json({}, { status: 502 })),
    /HTTP 502/,
  )
})

test('rejects malformed or insecure URLs from a successful upload response', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })

  await assert.rejects(
    uploadImageToCloudinary(file, async () => Response.json({ url: 'http://example.test/photo.jpg' })),
    /URL foto yang tidak aman/,
  )
  await assert.rejects(
    uploadImageToCloudinary(file, async () => new Response('not json', { status: 200 })),
    /respons yang tidak valid/,
  )
  await assert.rejects(
    uploadImageToCloudinary(file, async () => Response.json({ url: 'https://example.test/photo.jpg' })),
    /URL foto yang tidak aman/,
  )
})

test('rejects oversized and unsupported images before sending an upload request', async () => {
  let uploadRequested = false
  const send = async () => {
    uploadRequested = true
    throw new Error('Upload should not be requested')
  }
  const oversizedFile = new File([new Uint8Array(MAX_CLOUDINARY_IMAGE_SIZE + 1)], 'large.jpg', { type: 'image/jpeg' })
  const unsupportedFile = new File(['not an image'], 'photo.svg', { type: 'image/svg+xml' })

  await assert.rejects(
    uploadImageToCloudinary(oversizedFile, send),
    /maksimal 10 MB/,
  )
  await assert.rejects(
    uploadImageToCloudinary(unsupportedFile, send),
    /JPEG, PNG, atau WebP/,
  )
  assert.equal(uploadRequested, false)
})

test('allows an image exactly at the 10 MB limit', async () => {
  const file = new File([new Uint8Array(MAX_CLOUDINARY_IMAGE_SIZE)], 'limit.png', { type: 'image/png' })
  let uploadRequested = false
  await uploadImageToCloudinary(
    file,
    async () => {
      uploadRequested = true
      return Response.json({
        url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/owner-folder/limit.png',
      })
    },
  )

  assert.equal(uploadRequested, true)
})
