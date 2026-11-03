import { isOwnedCloudinaryImageUrl } from '../../shared/utils/cloudinary-upload-policy.ts'

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

export function isCloudinaryImageUrl(value: unknown): value is string {
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

    return url.pathname.split('/').every((segment) => {
      const decoded = decodeURIComponent(segment)
      return decoded !== '.'
        && decoded !== '..'
        && !decoded.includes('/')
        && !decoded.includes('\\')
    })
      && /\/image\/upload\//.test(url.pathname)
  } catch {
    return false
  }
}

export function isCloudinaryImageOwnedBy(
  value: unknown,
  cloudName: string,
  folder: string,
): value is string {
  return isCloudinaryImageUrl(value)
    && isOwnedCloudinaryImageUrl(value, cloudName, folder)
}

export function cloudinaryPublicIdFromLibraryUrl(
  value: unknown,
  cloudName: string,
  folder: string,
): string | null {
  if (!isCloudinaryImageUrl(value)) return null

  const url = new URL(value)
  const segments = decodeURIComponent(url.pathname).split('/').filter(Boolean)
  if (
    segments[0] !== cloudName
    || segments[1] !== 'image'
    || segments[2] !== 'upload'
  ) {
    return null
  }

  const assetSegments = segments.slice(3)
  const versionIndex = assetSegments.findIndex(segment => /^v\d+$/.test(segment))
  if (versionIndex < 0) return null

  const publicIdSegments = assetSegments.slice(versionIndex + 1)
  const folderSegments = folder.split('/')
  const hasCurrentOwnerFolder = folderSegments.every(
    (segment, index) => publicIdSegments[index] === segment,
  )
  const hasLegacyLibraryFolder = publicIdSegments[0] === 'kekasih'
    && publicIdSegments.length === 2
  if (!hasCurrentOwnerFolder && !hasLegacyLibraryFolder) return null

  const relativeSegments = hasCurrentOwnerFolder
    ? publicIdSegments.slice(folderSegments.length)
    : publicIdSegments.slice(1)
  if (
    !relativeSegments.length
    || relativeSegments.some(segment => !segment || segment === '.' || segment === '..' || segment.includes('\\'))
  ) {
    return null
  }

  const lastSegment = relativeSegments.at(-1)
  if (!lastSegment || !/\.(?:jpe?g|png|webp)$/i.test(lastSegment)) return null

  const publicIdFileName = lastSegment.replace(/\.(?:jpe?g|png|webp)$/i, '')
  const publicIdPath = hasCurrentOwnerFolder
    ? [...folderSegments, ...relativeSegments.slice(0, -1), publicIdFileName]
    : ['kekasih', publicIdFileName]
  return publicIdPath.join('/')
}
