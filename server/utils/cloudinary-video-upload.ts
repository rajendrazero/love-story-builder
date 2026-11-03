import type { CloudinaryVideoMimeType } from '../../shared/utils/cloudinary-upload-policy.ts'
import {
  ALLOWED_CLOUDINARY_VIDEO_FORMATS,
  isOwnedCloudinaryVideoUrl,
} from '../../shared/utils/cloudinary-upload-policy.ts'
import type { CloudinaryCredentials } from './cloudinary-signature.ts'
import { createCloudinaryUploadSignature } from './cloudinary-signature.ts'

export function cloudinaryVideoMimeTypeFromBytes(bytes: Uint8Array): CloudinaryVideoMimeType | null {
  if (
    bytes[4] === 0x66
    && bytes[5] === 0x74
    && bytes[6] === 0x79
    && bytes[7] === 0x70
  ) {
    return 'video/mp4'
  }
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return 'video/webm'
  }
  return null
}

interface UploadCloudinaryVideoOptions {
  credentials: CloudinaryCredentials
  folder: string
  fileBytes: ArrayBuffer
  mimeType: CloudinaryVideoMimeType
  timestamp?: number
  fetcher?: typeof fetch
}

export async function uploadCloudinaryVideo(options: UploadCloudinaryVideoOptions): Promise<string> {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const signature = await createCloudinaryUploadSignature(
    options.credentials,
    timestamp,
    options.folder,
    { allowedFormats: ALLOWED_CLOUDINARY_VIDEO_FORMATS },
  )
  const extension = options.mimeType === 'video/mp4' ? 'mp4' : 'webm'
  const body = new FormData()
  body.append('file', new Blob([options.fileBytes], { type: options.mimeType }), `video.${extension}`)
  body.append('api_key', signature.apiKey)
  body.append('folder', signature.folder)
  body.append('allowed_formats', signature.allowedFormats)
  body.append('timestamp', String(signature.timestamp))
  body.append('signature', signature.signature)

  const response = await (options.fetcher ?? fetch)(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(options.credentials.cloudName)}/video/upload`,
    {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(60_000),
    },
  )

  const result: unknown = await response.json()
  if (
    !response.ok
    || typeof result !== 'object'
    || result === null
    || !('secure_url' in result)
    || typeof result.secure_url !== 'string'
    || !isOwnedCloudinaryVideoUrl(result.secure_url, options.credentials.cloudName, options.folder)
  ) {
    throw new Error(`Cloudinary video upload failed with HTTP ${response.status}.`)
  }

  return result.secure_url
}
