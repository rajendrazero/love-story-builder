export const MAX_CLOUDINARY_IMAGE_SIZE = 10 * 1024 * 1024
export const ALLOWED_CLOUDINARY_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export const CLOUDINARY_UPLOAD_PRESET = 'galerry_user_images_v1'

export function isAllowedCloudinaryImageMimeType(value: string): boolean {
  return value === 'image/jpeg' || value === 'image/png' || value === 'image/webp'
}

export function isOwnedCloudinaryImageUrl(
  value: unknown,
  cloudName: string,
  folder: string,
): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false

  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:'
      || url.hostname !== 'res.cloudinary.com'
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
      || segments[1] !== 'image'
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
