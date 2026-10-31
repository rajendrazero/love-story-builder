export interface CloudinaryUploadSignatureResponse {
  cloudName: string
  apiKey: string
  folder: string
  timestamp: number
  signature: string
}

interface CloudinaryUploadResponse {
  secure_url?: unknown
  error?: { message?: unknown }
}

export async function uploadImageToCloudinary(
  file: File,
  requestSignature: () => Promise<CloudinaryUploadSignatureResponse>,
  send: typeof fetch = fetch,
): Promise<string> {
  const signature = await requestSignature()
  const body = new FormData()
  body.append('file', file)
  body.append('api_key', signature.apiKey)
  body.append('folder', signature.folder)
  body.append('timestamp', String(signature.timestamp))
  body.append('signature', signature.signature)

  const response = await send(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, {
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
  const result = payload as CloudinaryUploadResponse

  if (!response.ok) {
    const message = typeof result.error?.message === 'string'
      ? result.error.message
      : `Cloudinary gagal mengunggah foto (HTTP ${response.status}).`
    throw new Error(message)
  }

  if (typeof result.secure_url !== 'string') {
    throw new Error('Cloudinary tidak mengembalikan URL foto yang aman.')
  }

  let secureUrl: URL
  try {
    secureUrl = new URL(result.secure_url)
  } catch {
    throw new Error('Cloudinary mengembalikan URL foto yang tidak valid.')
  }
  if (secureUrl.protocol !== 'https:') {
    throw new Error('Cloudinary mengembalikan URL foto yang tidak aman.')
  }

  return secureUrl.toString()
}
