import type { CloudinaryCredentials } from './cloudinary-signature.ts'
import { createCloudinaryUploadSignature } from './cloudinary-signature.ts'
import { isOwnedCloudinaryImageUrl } from '../../shared/utils/cloudinary-upload-policy.ts'

export type CloudinaryImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

export function cloudinaryImageMimeTypeFromBytes(bytes: Uint8Array): CloudinaryImageMimeType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (
    bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4e
    && bytes[3] === 0x47
    && bytes[4] === 0x0d
    && bytes[5] === 0x0a
    && bytes[6] === 0x1a
    && bytes[7] === 0x0a
  ) {
    return 'image/png'
  }
  if (
    bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

interface UploadCloudinaryImageOptions {
  credentials: CloudinaryCredentials
  folder: string
  fileBytes: ArrayBuffer
  mimeType: CloudinaryImageMimeType
  timestamp?: number
  fetcher?: typeof fetch
}

export async function uploadCloudinaryImage(
  options: UploadCloudinaryImageOptions,
): Promise<string> {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const signature = await createCloudinaryUploadSignature(
    options.credentials,
    timestamp,
    options.folder,
  )
  const body = new FormData()
  body.append('file', new Blob([options.fileBytes], { type: options.mimeType }), `photo.${options.mimeType.slice(6)}`)
  body.append('api_key', signature.apiKey)
  body.append('folder', signature.folder)
  body.append('allowed_formats', signature.allowedFormats)
  body.append('timestamp', String(signature.timestamp))
  body.append('signature', signature.signature)

  const response = await (options.fetcher ?? fetch)(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(options.credentials.cloudName)}/image/upload`,
    {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(15_000),
    },
  )

  const result: unknown = await response.json()
  if (
    !response.ok
    || typeof result !== 'object'
    || result === null
    || !('secure_url' in result)
    || typeof result.secure_url !== 'string'
    || !isOwnedCloudinaryImageUrl(result.secure_url, options.credentials.cloudName, options.folder)
  ) {
    throw new Error(`Cloudinary image upload failed with HTTP ${response.status}.`)
  }

  return result.secure_url
}
