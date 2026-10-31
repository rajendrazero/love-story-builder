import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'
import { createCloudinaryUploadSignature, resolveCloudinaryCredentials } from '../../utils/cloudinary-signature'

export default defineEventHandler(async (event) => {
  const env = getAppEnv(event)
  const runtimeConfig = useRuntimeConfig(event)
  const credentials = resolveCloudinaryCredentials(
    {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      apiSecret: env.CLOUDINARY_API_SECRET,
    },
    {
      cloudName: runtimeConfig.cloudinaryCloudName,
      apiKey: runtimeConfig.cloudinaryApiKey,
      apiSecret: runtimeConfig.cloudinaryApiSecret,
    },
  )

  if (!credentials) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Konfigurasi Cloudinary belum lengkap atau tidak konsisten.',
    })
  }

  return createCloudinaryUploadSignature(credentials, Math.floor(Date.now() / 1000))
})
