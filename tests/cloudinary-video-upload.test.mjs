import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  cloudinaryVideoMimeTypeFromBytes,
  uploadCloudinaryVideo,
} from '../server/utils/cloudinary-video-upload.ts'
import { uploadVideoToCloudinary } from '../shared/utils/cloudinary-video-upload.ts'
import {
  ALLOWED_CLOUDINARY_VIDEO_FORMATS,
  MAX_CLOUDINARY_VIDEO_SIZE,
} from '../shared/utils/cloudinary-upload-policy.ts'

globalThis.crypto ??= webcrypto

const credentials = {
  cloudName: 'test-cloud',
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
}
const folder = 'kekasih/owner-folder'
const timestamp = 1_700_000_000
const mp4Bytes = new Uint8Array([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
])

test('detects supported video formats from file signatures', () => {
  assert.equal(cloudinaryVideoMimeTypeFromBytes(mp4Bytes), 'video/mp4')
  assert.equal(cloudinaryVideoMimeTypeFromBytes(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])), 'video/webm')
  assert.equal(cloudinaryVideoMimeTypeFromBytes(new Uint8Array([0x00, 0x01, 0x02])), null)
})

test('uploads server-validated video with owner folder and signed allowed formats', async () => {
  let requestUrl = ''
  let requestOptions
  const url = await uploadCloudinaryVideo({
    credentials,
    folder,
    fileBytes: mp4Bytes.buffer,
    mimeType: 'video/mp4',
    timestamp,
    fetcher: async (target, options) => {
      requestUrl = target
      requestOptions = options
      return Response.json({
        secure_url: `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/video.mp4`,
      })
    },
  })

  const allowedFormats = ALLOWED_CLOUDINARY_VIDEO_FORMATS.join(',')
  const signature = createHash('sha1')
    .update(`allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`)
    .digest('hex')
  const body = requestOptions.body
  assert.equal(requestUrl, 'https://api.cloudinary.com/v1_1/test-cloud/video/upload')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(body.get('file').type, 'video/mp4')
  assert.equal(body.get('file').name, 'video.mp4')
  assert.equal(body.get('folder'), folder)
  assert.equal(body.get('allowed_formats'), allowedFormats)
  assert.equal(body.get('signature'), signature)
  assert.equal(body.get('api_secret'), null)
  assert.equal(url, `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/video.mp4`)
})

test('rejects Cloudinary video responses outside the signed owner folder', async () => {
  await assert.rejects(
    uploadCloudinaryVideo({
      credentials,
      folder,
      fileBytes: mp4Bytes.buffer,
      mimeType: 'video/mp4',
      fetcher: async () => Response.json({
        secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v123/kekasih/other/video.mp4',
      }),
    }),
    /Cloudinary video upload failed/,
  )
})

test('uploads selected videos through the authenticated application endpoint', async () => {
  const file = new File([mp4Bytes], 'story.mp4', { type: 'video/mp4' })
  let requestUrl = ''
  let requestOptions
  const secureUrl = await uploadVideoToCloudinary(file, true, async (url, options) => {
    requestUrl = url
    requestOptions = options
    return Response.json({
      url: `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/video.mp4`,
    })
  })

  assert.equal(requestUrl, '/api/uploads/video')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(requestOptions.body.get('file').name, 'story.mp4')
  assert.equal(requestOptions.body.get('rightsConfirmed'), 'true')
  assert.equal(secureUrl, `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/video.mp4`)
})

test('rejects unconfirmed and unsupported videos before sending them', async () => {
  const send = async () => {
    throw new Error('Upload should not be requested')
  }
  const file = new File([mp4Bytes], 'story.mp4', { type: 'video/mp4' })
  const unsupported = new File(['not a video'], 'story.mov', { type: 'video/quicktime' })

  await assert.rejects(uploadVideoToCloudinary(file, false, send), /hak penggunaan/)
  await assert.rejects(uploadVideoToCloudinary(unsupported, true, send), /MP4 atau WebM/)
  assert.equal(MAX_CLOUDINARY_VIDEO_SIZE, 50 * 1024 * 1024)
})

test('rejects unsuccessful and unsafe video upload responses', async () => {
  const file = new File([mp4Bytes], 'story.mp4', { type: 'video/mp4' })

  await assert.rejects(
    uploadVideoToCloudinary(file, true, async () => Response.json(
      { statusMessage: 'Konfigurasi Cloudinary belum lengkap.' },
      { status: 503 },
    )),
    /Konfigurasi Cloudinary belum lengkap/,
  )
  await assert.rejects(
    uploadVideoToCloudinary(file, true, async () => Response.json({
      url: 'https://cloudinary.example/video/upload/video.mp4',
    })),
    /URL video yang tidak aman/,
  )
})

test('video endpoint enforces authenticated, rate-limited and validated uploads', () => {
  const endpoint = readFileSync(new URL('../server/api/uploads/video.post.ts', import.meta.url), 'utf8')

  assert.match(endpoint, /requireUser\(event\)/)
  assert.match(endpoint, /enforceRateLimit\(event, 'upload-video'/)
  assert.match(endpoint, /formData\.get\('rightsConfirmed'\) !== 'true'/)
  assert.match(endpoint, /cloudinaryVideoMimeTypeFromBytes/)
  assert.match(endpoint, /cloudinaryUploadFolderForOwner\(user\.id\)/)
  assert.match(endpoint, /MAX_CLOUDINARY_VIDEO_SIZE/)
  assert.match(endpoint, /logOperationalError/)
})
