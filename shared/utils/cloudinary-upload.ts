import {
  isAllowedCloudinaryImageMimeType,
  MAX_CLOUDINARY_IMAGE_SIZE,
} from './cloudinary-upload-policy.ts'

export async function uploadImageToCloudinary(
  file: File,
  send: typeof fetch = fetch,
): Promise<string> {
  if (!isAllowedCloudinaryImageMimeType(file.type)) {
    throw new Error('Pilih foto berformat JPEG, PNG, atau WebP.')
  }
  if (file.size > MAX_CLOUDINARY_IMAGE_SIZE) {
    throw new Error('Ukuran foto maksimal 10 MB.')
  }

  const body = new FormData()
  body.append('file', file)

  const response = await send('/api/uploads/image', {
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
      : `Foto belum dapat diunggah (HTTP ${response.status}).`
    throw new Error(message)
  }

  if (!('url' in payload)) {
    throw new Error(`Server mengirim respons foto yang tidak valid (HTTP ${response.status}).`)
  }

  if (typeof payload.url !== 'string') {
    throw new Error('Server tidak mengembalikan URL foto yang aman.')
  }

  let secureUrl: URL
  try {
    secureUrl = new URL(payload.url)
  } catch {
    throw new Error('Server mengembalikan URL foto yang tidak valid.')
  }
  if (
    secureUrl.protocol !== 'https:'
    || secureUrl.hostname !== 'res.cloudinary.com'
    || secureUrl.username
    || secureUrl.password
    || secureUrl.search
    || secureUrl.hash
  ) {
    throw new Error('Server mengembalikan URL foto yang tidak aman.')
  }

  return secureUrl.toString()
}
