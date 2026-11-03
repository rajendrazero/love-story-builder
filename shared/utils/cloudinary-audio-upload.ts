import {
  cloudinaryAudioMimeType,
  MAX_CLOUDINARY_AUDIO_SIZE,
} from './cloudinary-upload-policy.ts'

export async function uploadAudioToCloudinary(
  file: File,
  rightsConfirmed: boolean,
  send: typeof fetch = fetch,
): Promise<string> {
  if (!rightsConfirmed) {
    throw new Error('Konfirmasi bahwa kamu memiliki hak penggunaan file audio.')
  }
  if (!cloudinaryAudioMimeType(file.type)) {
    throw new Error('Pilih file MP3, M4A, OGG, atau WAV.')
  }
  if (file.size > MAX_CLOUDINARY_AUDIO_SIZE) {
    throw new Error('Ukuran audio maksimal 20 MB.')
  }

  const body = new FormData()
  body.append('file', file)
  body.append('rightsConfirmed', 'true')

  const response = await send('/api/uploads/audio', {
    method: 'POST',
    body,
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`Cloudinary mengirim respons yang tidak valid (HTTP ${response.status}).`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error(`Cloudinary mengirim respons yang tidak valid (HTTP ${response.status}).`)
  }
  if (!response.ok) {
    const message = 'statusMessage' in payload && typeof payload.statusMessage === 'string'
      ? payload.statusMessage
      : `Audio belum dapat diunggah (HTTP ${response.status}).`
    throw new Error(message)
  }
  if (!('url' in payload) || typeof payload.url !== 'string') {
    throw new Error('Server tidak mengembalikan URL audio yang aman.')
  }

  let secureUrl: URL
  try {
    secureUrl = new URL(payload.url)
  } catch {
    throw new Error('Server mengembalikan URL audio yang tidak valid.')
  }
  const path = secureUrl.pathname.split('/').filter(Boolean)
  if (
    secureUrl.protocol !== 'https:'
    || secureUrl.hostname !== 'res.cloudinary.com'
    || secureUrl.username
    || secureUrl.password
    || secureUrl.search
    || secureUrl.hash
    || path[1] !== 'video'
    || path[2] !== 'upload'
  ) {
    throw new Error('Server mengembalikan URL audio yang tidak aman.')
  }

  return secureUrl.toString()
}
