import { createError, defineEventHandler } from 'h3'
import { getAppEnv, toHex } from '../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  const env = getAppEnv(event)
  const cloudName = env.CLOUDINARY_CLOUD_NAME || useRuntimeConfig(event).cloudinaryCloudName
  const apiKey = env.CLOUDINARY_API_KEY || useRuntimeConfig(event).cloudinaryApiKey
  const apiSecret = env.CLOUDINARY_API_SECRET || useRuntimeConfig(event).cloudinaryApiSecret

  if (!cloudName || !apiKey || !apiSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Konfigurasi Cloudinary belum lengkap.' })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = 'kekasih'
  const signature = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(`folder=${folder}&timestamp=${timestamp}${apiSecret}`),
  )

  return { cloudName, apiKey, folder, timestamp, signature: toHex(signature) }
})
