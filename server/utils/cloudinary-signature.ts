import {
  ALLOWED_CLOUDINARY_IMAGE_FORMATS,
} from '../../shared/utils/cloudinary-upload-policy.ts'

export interface CloudinaryCredentials {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export interface CloudinaryUploadSignature extends Omit<CloudinaryCredentials, 'apiSecret'> {
  folder: string
  allowedFormats: string
  timestamp: number
  signature: string
}

interface CloudinaryConfigValues {
  cloudName?: unknown
  apiKey?: unknown
  apiSecret?: unknown
}

export const cloudinaryUploadFolder = 'kekasih'

export async function cloudinaryUploadFolderForOwner(ownerId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ownerId))
  const ownerFolder = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  return `${cloudinaryUploadFolder}/${ownerFolder}`
}

function normalizeConfiguredValue(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const normalized = String(value).trim()
  return normalized || undefined
}

function configuredValue(primary?: unknown, fallback?: unknown): string | undefined {
  return normalizeConfiguredValue(primary) || normalizeConfiguredValue(fallback)
}

export function resolveCloudinaryCloudName(
  environment: CloudinaryConfigValues,
  runtimeConfig: CloudinaryConfigValues,
): string | null {
  const environmentValue = normalizeConfiguredValue(environment.cloudName)
  const runtimeValue = normalizeConfiguredValue(runtimeConfig.cloudName)
  if (environmentValue && runtimeValue && environmentValue !== runtimeValue) return null
  return configuredValue(environmentValue, runtimeValue) ?? null
}

export function resolveCloudinaryCredentials(
  environment: CloudinaryConfigValues,
  runtimeConfig: CloudinaryConfigValues,
): CloudinaryCredentials | null {
  for (const key of ['apiKey', 'apiSecret'] as const) {
    const environmentValue = normalizeConfiguredValue(environment[key])
    const runtimeValue = normalizeConfiguredValue(runtimeConfig[key])
    if (environmentValue && runtimeValue && environmentValue !== runtimeValue) return null
  }

  const cloudName = resolveCloudinaryCloudName(environment, runtimeConfig)
  const apiKey = configuredValue(environment.apiKey, runtimeConfig.apiKey)
  const apiSecret = configuredValue(environment.apiSecret, runtimeConfig.apiSecret)

  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

export async function createCloudinaryUploadSignature(
  credentials: CloudinaryCredentials,
  timestamp: number,
  folder: string,
  options: { allowedFormats?: readonly string[] } = {},
): Promise<CloudinaryUploadSignature> {
  const allowedFormats = (options.allowedFormats ?? ALLOWED_CLOUDINARY_IMAGE_FORMATS).join(',')
  const source = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(source))
  const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')

  return {
    cloudName: credentials.cloudName,
    apiKey: credentials.apiKey,
    folder,
    allowedFormats,
    timestamp,
    signature,
  }
}
