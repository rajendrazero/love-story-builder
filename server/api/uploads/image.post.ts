import { createError, defineEventHandler, getHeader, readFormData } from 'h3'
import { MAX_CLOUDINARY_IMAGE_SIZE } from '../../../shared/utils/cloudinary-upload-policy'
import { getAppEnv } from '../../utils/cloudflare'
import {
  cloudinaryUploadFolderForOwner,
  resolveCloudinaryCredentials,
} from '../../utils/cloudinary-signature'
import {
  cloudinaryImageMimeTypeFromBytes,
  uploadCloudinaryImage,
} from '../../utils/cloudinary-upload'
import { logOperationalError } from '../../utils/observability'
import { enforceRateLimit } from '../../utils/rate-limit'
import { requireUser } from '../../utils/require-user'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'upload-image', 12, 60, user.id)

  const contentLength = Number(getHeader(event, 'content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_CLOUDINARY_IMAGE_SIZE + 64 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran foto maksimal 10 MB.' })
  }

  let formData: FormData
  try {
    formData = await readFormData(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Form unggah foto tidak valid.' })
  }

  const formEntries = Array.from(formData.entries())
  const file = formData.get('file')
  if (
    formEntries.length !== 1
    || !file
    || typeof file === 'string'
    || !(file instanceof File)
    || !file.name
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Pilih satu file foto yang valid.' })
  }
  if (file.size > MAX_CLOUDINARY_IMAGE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran foto maksimal 10 MB.' })
  }

  const fileBytes = await file.arrayBuffer()
  if (fileBytes.byteLength > MAX_CLOUDINARY_IMAGE_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran foto maksimal 10 MB.' })
  }

  const mimeType = cloudinaryImageMimeTypeFromBytes(new Uint8Array(fileBytes))
  if (!mimeType || file.type !== mimeType) {
    throw createError({ statusCode: 415, statusMessage: 'Pilih foto JPEG, PNG, atau WebP yang valid.' })
  }

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

  const folder = await cloudinaryUploadFolderForOwner(user.id)
  try {
    const url = await uploadCloudinaryImage({
      credentials,
      folder,
      fileBytes,
      mimeType,
    })
    return { url }
  } catch (error) {
    logOperationalError(event, 'cloudinary.asset_upload_failed', error, {
      provider: 'cloudinary',
      operation: 'upload',
    }, [credentials.apiKey, credentials.apiSecret])
    throw createError({
      statusCode: 502,
      statusMessage: 'Foto belum dapat diunggah ke Cloudinary. Coba lagi.',
    })
  }
})
