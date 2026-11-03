import type { CloudinaryCredentials } from './cloudinary-signature'

export interface CloudinaryDeletionOptions {
  credentials: CloudinaryCredentials
  publicId: string
  timestamp?: number
  fetcher?: typeof fetch
}

export async function destroyCloudinaryImage(options: CloudinaryDeletionOptions): Promise<void> {
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000)
  const signatureSource = `public_id=${options.publicId}&timestamp=${timestamp}${options.credentials.apiSecret}`
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signatureSource))
  const signature = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  const body = new URLSearchParams({
    api_key: options.credentials.apiKey,
    public_id: options.publicId,
    signature,
    timestamp: String(timestamp),
  })
  const response = await (options.fetcher ?? fetch)(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(options.credentials.cloudName)}/image/destroy`,
    {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(10_000),
    },
  )

  if (!response.ok) {
    throw new Error(`Cloudinary asset deletion failed with HTTP ${response.status}.`)
  }

  const result: unknown = await response.json()
  if (
    typeof result !== 'object'
    || result === null
    || !('result' in result)
    || (result.result !== 'ok' && result.result !== 'not found')
  ) {
    throw new Error('Cloudinary returned an unexpected asset deletion response.')
  }
}
