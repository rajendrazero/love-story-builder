import assert from 'node:assert/strict'
import { createHash, webcrypto } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  cloudinaryAudioMimeTypeFromBytes,
  uploadCloudinaryAudio,
} from '../server/utils/cloudinary-audio-upload.ts'
import { uploadAudioToCloudinary } from '../shared/utils/cloudinary-audio-upload.ts'
import {
  ALLOWED_CLOUDINARY_AUDIO_FORMATS,
  MAX_CLOUDINARY_AUDIO_SIZE,
} from '../shared/utils/cloudinary-upload-policy.ts'

globalThis.crypto ??= webcrypto

const credentials = {
  cloudName: 'test-cloud',
  apiKey: 'test-api-key',
  apiSecret: 'test-api-secret',
}
const folder = 'kekasih/owner-folder'
const timestamp = 1_700_000_000
const mp3Bytes = new Uint8Array([0x49, 0x44, 0x33, 0x00])

test('detects supported audio formats from their file signatures', () => {
  assert.equal(cloudinaryAudioMimeTypeFromBytes(mp3Bytes), 'audio/mpeg')
  assert.equal(cloudinaryAudioMimeTypeFromBytes(new Uint8Array([0xff, 0xfb, 0x90])), 'audio/mpeg')
  assert.equal(cloudinaryAudioMimeTypeFromBytes(new Uint8Array([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20,
  ])), 'audio/mp4')
  assert.equal(cloudinaryAudioMimeTypeFromBytes(new Uint8Array([0x4f, 0x67, 0x67, 0x53])), 'audio/ogg')
  assert.equal(cloudinaryAudioMimeTypeFromBytes(new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
  ])), 'audio/wav')
  assert.equal(cloudinaryAudioMimeTypeFromBytes(new Uint8Array([0x00, 0x01, 0x02])), null)
})

test('uploads server-validated audio with a signed folder and allowed formats', async () => {
  let requestUrl = ''
  let requestOptions
  const url = await uploadCloudinaryAudio({
    credentials,
    folder,
    fileBytes: mp3Bytes.buffer,
    mimeType: 'audio/mpeg',
    timestamp,
    fetcher: async (target, options) => {
      requestUrl = target
      requestOptions = options
      return Response.json({
        secure_url: `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/audio.mp3`,
      })
    },
  })

  const allowedFormats = ALLOWED_CLOUDINARY_AUDIO_FORMATS.join(',')
  const signature = createHash('sha1')
    .update(`allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`)
    .digest('hex')
  const body = requestOptions.body
  assert.equal(requestUrl, 'https://api.cloudinary.com/v1_1/test-cloud/video/upload')
  assert.equal(requestOptions.method, 'POST')
  assert.ok(requestOptions.signal instanceof AbortSignal)
  assert.equal(body.get('file').type, 'audio/mpeg')
  assert.equal(body.get('file').name, 'audio.mp3')
  assert.equal(body.get('api_key'), credentials.apiKey)
  assert.equal(body.get('folder'), folder)
  assert.equal(body.get('allowed_formats'), allowedFormats)
  assert.equal(body.get('timestamp'), String(timestamp))
  assert.equal(body.get('signature'), signature)
  assert.equal(body.get('api_secret'), null)
  assert.equal(url, `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/audio.mp3`)
})

test('rejects Cloudinary audio responses outside the signed owner folder', async () => {
  await assert.rejects(
    uploadCloudinaryAudio({
      credentials,
      folder,
      fileBytes: mp3Bytes.buffer,
      mimeType: 'audio/mpeg',
      fetcher: async () => Response.json({
        secure_url: 'https://res.cloudinary.com/test-cloud/video/upload/v123/kekasih/other/audio.mp3',
      }),
    }),
    /Cloudinary audio upload failed/,
  )
})

test('uploads selected files through the authenticated application endpoint', async () => {
  const file = new File([mp3Bytes], 'song.mp3', { type: 'audio/mpeg' })
  let requestUrl = ''
  let requestOptions
  const secureUrl = await uploadAudioToCloudinary(file, true, async (url, options) => {
    requestUrl = url
    requestOptions = options
    return Response.json({
      url: `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/audio.mp3`,
    })
  })

  assert.equal(requestUrl, '/api/uploads/audio')
  assert.equal(requestOptions.method, 'POST')
  assert.equal(requestOptions.body.get('file').name, 'song.mp3')
  assert.equal(requestOptions.body.get('rightsConfirmed'), 'true')
  assert.equal(secureUrl, `https://res.cloudinary.com/test-cloud/video/upload/v123/${folder}/audio.mp3`)
})

test('rejects unconfirmed, unsupported, or oversized audio before sending it', async () => {
  const send = async () => {
    throw new Error('Upload should not be requested')
  }
  const file = new File([mp3Bytes], 'song.mp3', { type: 'audio/mpeg' })
  const unsupported = new File(['not audio'], 'song.txt', { type: 'text/plain' })
  const oversized = new File(
    [new Uint8Array(MAX_CLOUDINARY_AUDIO_SIZE + 1)],
    'large.mp3',
    { type: 'audio/mpeg' },
  )

  await assert.rejects(uploadAudioToCloudinary(file, false, send), /hak penggunaan/)
  await assert.rejects(uploadAudioToCloudinary(unsupported, true, send), /MP3, M4A, OGG, atau WAV/)
  await assert.rejects(uploadAudioToCloudinary(oversized, true, send), /maksimal 20 MB/)
})

test('rejects unsuccessful and unsafe audio upload responses', async () => {
  const file = new File([mp3Bytes], 'song.mp3', { type: 'audio/mpeg' })

  await assert.rejects(
    uploadAudioToCloudinary(file, true, async () => Response.json(
      { statusMessage: 'Konfigurasi Cloudinary belum lengkap.' },
      { status: 503 },
    )),
    /Konfigurasi Cloudinary belum lengkap/,
  )
  await assert.rejects(
    uploadAudioToCloudinary(file, true, async () => Response.json({
      url: 'https://cloudinary.example/video/upload/audio.mp3',
    })),
    /URL audio yang tidak aman/,
  )
  await assert.rejects(
    uploadAudioToCloudinary(file, true, async () => new Response('invalid json')),
    /respons yang tidak valid/,
  )
})

test('the audio endpoint enforces authenticated, rate-limited, rights-confirmed uploads', () => {
  const endpoint = readFileSync(new URL('../server/api/uploads/audio.post.ts', import.meta.url), 'utf8')

  assert.match(endpoint, /requireUser\(event\)/)
  assert.match(endpoint, /enforceRateLimit\(event, 'upload-audio'/)
  assert.match(endpoint, /formData\.get\('rightsConfirmed'\) !== 'true'/)
  assert.match(endpoint, /cloudinaryAudioMimeTypeFromBytes/)
  assert.match(endpoint, /cloudinaryUploadFolderForOwner\(user\.id\)/)
  assert.match(endpoint, /logOperationalError/)
})
