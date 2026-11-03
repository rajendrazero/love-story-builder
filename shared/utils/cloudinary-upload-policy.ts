export const MAX_CLOUDINARY_IMAGE_SIZE = 10 * 1024 * 1024
export const ALLOWED_CLOUDINARY_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export const ALLOWED_CLOUDINARY_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'] as const
export const MAX_CLOUDINARY_AUDIO_SIZE = 20 * 1024 * 1024
export const ALLOWED_CLOUDINARY_AUDIO_FORMATS = ['mp3', 'm4a', 'ogg', 'wav'] as const
export const ALLOWED_CLOUDINARY_AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
] as const
export const MAX_CLOUDINARY_VIDEO_SIZE = 50 * 1024 * 1024
export const ALLOWED_CLOUDINARY_VIDEO_FORMATS = ['mp4', 'webm'] as const
export const ALLOWED_CLOUDINARY_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm'] as const

export type CloudinaryAudioMimeType = 'audio/mpeg' | 'audio/mp4' | 'audio/ogg' | 'audio/wav'
export type CloudinaryVideoMimeType = typeof ALLOWED_CLOUDINARY_VIDEO_MIME_TYPES[number]

export function isAllowedCloudinaryImageMimeType(value: string): boolean {
  return value === 'image/jpeg' || value === 'image/png' || value === 'image/webp'
}

export function cloudinaryAudioMimeType(value: string): CloudinaryAudioMimeType | null {
  if (value === 'audio/mpeg' || value === 'audio/mp3') return 'audio/mpeg'
  if (value === 'audio/mp4') return 'audio/mp4'
  if (value === 'audio/ogg') return 'audio/ogg'
  if (value === 'audio/wav' || value === 'audio/x-wav') return 'audio/wav'
  return null
}

export function isAllowedCloudinaryAudioMimeType(value: string): boolean {
  return cloudinaryAudioMimeType(value) !== null
}

export function cloudinaryVideoMimeType(value: string): CloudinaryVideoMimeType | null {
  return value === 'video/mp4' || value === 'video/webm' ? value : null
}

function hasSafeCloudinaryPath(value: string): boolean {
  const rawPath = /^https:\/\/[^/?#]+(\/[^?#]*)?/i.exec(value)?.[1] ?? '/'
  return rawPath.split('/').every((segment) => {
    try {
      const decoded = decodeURIComponent(segment)
      return decoded !== '.'
        && decoded !== '..'
        && !decoded.includes('/')
        && !decoded.includes('\\')
        && !/%(?:2e|2f|5c)/i.test(decoded)
    } catch {
      return false
    }
  })
}

function isOwnedCloudinaryResourceUrl(
  value: unknown,
  cloudName: string,
  folder: string,
  resourceType: 'image' | 'video',
): value is string {
  if (typeof value !== 'string' || value.length > 2048 || !hasSafeCloudinaryPath(value)) return false

  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:'
      || url.hostname !== 'res.cloudinary.com'
      || url.port
      || url.username
      || url.password
      || url.search
      || url.hash
    ) {
      return false
    }

    const path = decodeURIComponent(url.pathname)
    const segments = path.split('/').filter(Boolean)
    if (
      segments[0] !== cloudName
      || segments[1] !== resourceType
      || segments[2] !== 'upload'
    ) {
      return false
    }

    const assetPath = segments.slice(3)
    if (/^v\d+$/.test(assetPath[0] ?? '')) assetPath.shift()

    const expectedFolder = folder.split('/')
    return expectedFolder.every((segment, index) => assetPath[index] === segment)
      && assetPath.length > expectedFolder.length
  } catch {
    return false
  }
}

export function isOwnedCloudinaryImageUrl(
  value: unknown,
  cloudName: string,
  folder: string,
): value is string {
  return isOwnedCloudinaryResourceUrl(value, cloudName, folder, 'image')
}

export function isOwnedCloudinaryAudioUrl(
  value: unknown,
  cloudName: string,
  folder: string,
): value is string {
  return isOwnedCloudinaryResourceUrl(value, cloudName, folder, 'video')
}

export function isOwnedCloudinaryVideoUrl(
  value: unknown,
  cloudName: string,
  folder: string,
): value is string {
  return isOwnedCloudinaryResourceUrl(value, cloudName, folder, 'video')
}
