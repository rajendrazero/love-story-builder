import { isOwnedCloudinaryImageUrl } from '../../shared/utils/cloudinary-upload-policy.ts'

export function isCloudinaryImageUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && url.hostname === 'res.cloudinary.com'
      && !url.username
      && !url.password
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
