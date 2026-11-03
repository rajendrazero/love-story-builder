import {
  cloudinaryVideoMimeType,
  MAX_CLOUDINARY_VIDEO_SIZE,
} from './cloudinary-upload-policy.ts'

export async function uploadVideoToCloudinary(
  file: File,
  rightsConfirmed: boolean,
  send: typeof fetch = fetch,
): Promise<string> {
  if (!rightsConfirmed) {
    throw new Error('Konfirmasi bahwa kamu memiliki hak penggunaan video.')
  }
  if (!cloudinaryVideoMimeType(file.type)) {
    throw new Error('Pilih file video MP4 atau WebM.')
  }
  if (file.size > MAX_CLOUDINARY_VIDEO_SIZE) {
    throw new Error('Ukuran video maksimal 50 MB.')
  }

  const body = new FormData()
  body.append('file', file)
  body.append('rightsConfirmed', 'true')

  const response = await send('/api/uploads/video', {
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
      : `Video belum dapat diunggah (HTTP ${response.status}).`
    throw new Error(message)
  }
  if (!('url' in payload) || typeof payload.url !== 'string') {
    throw new Error('Server tidak mengembalikan URL video yang aman.')
  }

  let secureUrl: URL
  try {
    secureUrl = new URL(payload.url)
  } catch {
    throw new Error('Server mengembalikan URL video yang tidak valid.')
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
    throw new Error('Server mengembalikan URL video yang tidak aman.')
  }

  return secureUrl.toString()
}
