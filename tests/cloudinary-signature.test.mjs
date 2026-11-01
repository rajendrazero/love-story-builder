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
  CLOUDINARY_UPLOAD_PRESET,
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
  const source = `folder=${folder}&timestamp=${timestamp}&upload_preset=${CLOUDINARY_UPLOAD_PRESET}${credentials.apiSecret}`
  const expectedSignature = createHash('sha1').update(source).digest('hex')

  assert.deepEqual(await createCloudinaryUploadSignature(credentials, timestamp, folder), {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    folder,
    timestamp,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
    signature: expectedSignature,
  })
})

test('creates distinct non-reversible upload folders for each owner', async () => {
  const firstOwnerFolder = await cloudinaryUploadFolderForOwner('owner-1')
  const secondOwnerFolder = await cloudinaryUploadFolderForOwner('owner-2')

  assert.match(firstOwnerFolder, /^kekasih\/[a-f0-9]{64}$/)
  assert.notEqual(firstOwnerFolder, secondOwnerFolder)
})

test('uploads the file with all signed parameters and returns only an HTTPS URL', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  const signature = {
    cloudName: 'test-cloud',
    apiKey: 'test-key',
    folder: 'kekasih/owner-folder',
    timestamp: 1_700_000_000,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
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
      return Response.json({ secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/owner-folder/photo.jpg' })
    },
  )

  assert.equal(requestUrl, 'https://api.cloudinary.com/v1_1/test-cloud/image/upload')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(requestOptions.body.get('file').name, 'photo.jpg')
  assert.equal(requestOptions.body.get('api_key'), 'test-key')
  assert.equal(requestOptions.body.get('folder'), 'kekasih/owner-folder')
  assert.equal(requestOptions.body.get('timestamp'), '1700000000')
  assert.equal(requestOptions.body.get('upload_preset'), CLOUDINARY_UPLOAD_PRESET)
  assert.equal(requestOptions.body.get('signature'), 'signed-value')
  assert.equal(secureUrl, 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/owner-folder/photo.jpg')
})

test('surfaces Cloudinary errors instead of accepting an unsuccessful upload', async () => {
  const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' })
  await assert.rejects(
    uploadImageToCloudinary(
      file,
      async () => ({
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        folder: 'kekasih/owner-folder',
        timestamp: 1_700_000_000,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
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
    folder: 'kekasih/owner-folder',
    timestamp: 1_700_000_000,
    uploadPreset: CLOUDINARY_UPLOAD_PRESET,
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
  await assert.rejects(
    uploadImageToCloudinary(file, requestSignature, async () => Response.json({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/another-owner/photo.jpg',
    })),
    /URL foto yang tidak aman/,
  )
})

test('rejects oversized and unsupported images before requesting an upload signature', async () => {
  let signatureRequested = false
  const requestSignature = async () => {
    signatureRequested = true
    throw new Error('Signature should not be requested')
  }
  const oversizedFile = new File([new Uint8Array(MAX_CLOUDINARY_IMAGE_SIZE + 1)], 'large.jpg', { type: 'image/jpeg' })
  const unsupportedFile = new File(['not an image'], 'photo.svg', { type: 'image/svg+xml' })

  await assert.rejects(
    uploadImageToCloudinary(oversizedFile, requestSignature),
    /maksimal 10 MB/,
  )
  await assert.rejects(
    uploadImageToCloudinary(unsupportedFile, requestSignature),
    /JPEG, PNG, atau WebP/,
  )
  assert.equal(signatureRequested, false)
})

test('allows an image exactly at the 10 MB limit', async () => {
  const file = new File([new Uint8Array(MAX_CLOUDINARY_IMAGE_SIZE)], 'limit.png', { type: 'image/png' })
  let signatureRequested = false
  await uploadImageToCloudinary(
    file,
    async () => {
      signatureRequested = true
      return {
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        folder: 'kekasih/owner-folder',
        timestamp: 1_700_000_000,
        uploadPreset: CLOUDINARY_UPLOAD_PRESET,
        signature: 'signed-value',
      }
    },
    async () => Response.json({
      secure_url: 'https://res.cloudinary.com/test-cloud/image/upload/v123/kekasih/owner-folder/limit.png',
    }),
  )

  assert.equal(signatureRequested, true)
})
