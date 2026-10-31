export interface CloudinaryCredentials {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export interface CloudinaryUploadSignature extends Omit<CloudinaryCredentials, 'apiSecret'> {
  folder: string
  timestamp: number
  signature: string
}

interface CloudinaryConfigValues {
  cloudName?: unknown
  apiKey?: unknown
  apiSecret?: unknown
}

export const cloudinaryUploadFolder = 'kekasih'

function normalizeConfiguredValue(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const normalized = String(value).trim()
  return normalized || undefined
}

function configuredValue(primary?: unknown, fallback?: unknown): string | undefined {
  return normalizeConfiguredValue(primary) || normalizeConfiguredValue(fallback)
}

export function resolveCloudinaryCredentials(
  environment: CloudinaryConfigValues,
  runtimeConfig: CloudinaryConfigValues,
): CloudinaryCredentials | null {
  for (const key of ['cloudName', 'apiKey', 'apiSecret'] as const) {
    const environmentValue = normalizeConfiguredValue(environment[key])
    const runtimeValue = normalizeConfiguredValue(runtimeConfig[key])
    if (environmentValue && runtimeValue && environmentValue !== runtimeValue) return null
  }

  const cloudName = configuredValue(environment.cloudName, runtimeConfig.cloudName)
  const apiKey = configuredValue(environment.apiKey, runtimeConfig.apiKey)
  const apiSecret = configuredValue(environment.apiSecret, runtimeConfig.apiSecret)

  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

export async function createCloudinaryUploadSignature(
  credentials: CloudinaryCredentials,
  timestamp: number,
): Promise<CloudinaryUploadSignature> {
  const folder = cloudinaryUploadFolder
  const source = `folder=${folder}&timestamp=${timestamp}${credentials.apiSecret}`
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(source))
  const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')

  return {
    cloudName: credentials.cloudName,
    apiKey: credentials.apiKey,
    folder,
    timestamp,
    signature,
  }
}
