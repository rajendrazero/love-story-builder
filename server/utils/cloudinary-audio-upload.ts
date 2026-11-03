import type { CloudinaryAudioMimeType } from '../../shared/utils/cloudinary-upload-policy.ts'
import {
  ALLOWED_CLOUDINARY_AUDIO_FORMATS,
  isOwnedCloudinaryAudioUrl,
} from '../../shared/utils/cloudinary-upload-policy.ts'
import type { CloudinaryCredentials } from './cloudinary-signature.ts'
import { createCloudinaryUploadSignature } from './cloudinary-signature.ts'

export function cloudinaryAudioMimeTypeFromBytes(bytes: Uint8Array): CloudinaryAudioMimeType | null {
  if (
    bytes[0] === 0x49
    && bytes[1] === 0x44
    && bytes[2] === 0x33
  ) {
    return 'audio/mpeg'
  }
  if (bytes[0] === 0xff && ((bytes[1] ?? 0) & 0xe0) === 0xe0) return 'audio/mpeg'
  if (
    bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x41
    && bytes[10] === 0x56
    && bytes[11] === 0x45
  ) {
    return 'audio/wav'
  }
  if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
    return 'audio/ogg'
  }
  if (
    bytes[4] === 0x66
    && bytes[5] === 0x74
    && bytes[6] === 0x79
    && bytes[7] === 0x70
    && (bytes[8] === 0x4d || bytes[8] === 0x46)
    && bytes[9] === 0x34
    && bytes[10] === 0x41
    && bytes[11] === 0x20
  ) {
    return 'audio/mp4'
  }
  return null
}

interface UploadCloudinaryAudioOptions {
  credentials: CloudinaryCredentials
  folder: string
  fileBytes: ArrayBuffer
  mimeType: CloudinaryAudioMimeType
  timestamp?: number
  fetcher?: typeof fetch
}

export async function uploadCloudinaryAudio(options: UploadCloudinaryAudioOptions): Promise<string> {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const signature = await createCloudinaryUploadSignature(
    options.credentials,
    timestamp,
    options.folder,
    { allowedFormats: ALLOWED_CLOUDINARY_AUDIO_FORMATS },
  )
  const body = new FormData()
  const extension = options.mimeType === 'audio/mpeg'
    ? 'mp3'
    : options.mimeType === 'audio/mp4'
      ? 'm4a'
      : options.mimeType === 'audio/ogg'
        ? 'ogg'
        : 'wav'
  body.append('file', new Blob([options.fileBytes], { type: options.mimeType }), `audio.${extension}`)
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
      signal: AbortSignal.timeout(30_000),
    },
  )

  const result: unknown = await response.json()
  if (
    !response.ok
    || typeof result !== 'object'
    || result === null
    || !('secure_url' in result)
    || typeof result.secure_url !== 'string'
    || !isOwnedCloudinaryAudioUrl(result.secure_url, options.credentials.cloudName, options.folder)
  ) {
    throw new Error(`Cloudinary audio upload failed with HTTP ${response.status}.`)
  }

  return result.secure_url
}
