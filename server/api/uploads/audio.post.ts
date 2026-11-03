import { createError, defineEventHandler, getHeader, readFormData } from 'h3'
import {
  MAX_CLOUDINARY_AUDIO_SIZE,
  cloudinaryAudioMimeType,
} from '../../../shared/utils/cloudinary-upload-policy'
import { getAppEnv } from '../../utils/cloudflare'
import {
  cloudinaryUploadFolderForOwner,
  resolveCloudinaryCredentials,
} from '../../utils/cloudinary-signature'
import {
  cloudinaryAudioMimeTypeFromBytes,
  uploadCloudinaryAudio,
} from '../../utils/cloudinary-audio-upload'
import { logOperationalError } from '../../utils/observability'
import { enforceRateLimit } from '../../utils/rate-limit'
import { requireUser } from '../../utils/require-user'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'upload-audio', 8, 60, user.id)

  const contentLength = Number(getHeader(event, 'content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_CLOUDINARY_AUDIO_SIZE + 64 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran audio maksimal 20 MB.' })
  }

  let formData: FormData
  try {
    formData = await readFormData(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Form unggah audio tidak valid.' })
  }

  const entries = Array.from(formData.entries())
  const file = formData.get('file')
  if (
    entries.length !== 2
    || formData.get('rightsConfirmed') !== 'true'
    || !file
    || typeof file === 'string'
    || !(file instanceof File)
    || !file.name
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Pilih satu file audio dan konfirmasi hak penggunaannya.',
    })
  }
  if (file.size > MAX_CLOUDINARY_AUDIO_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran audio maksimal 20 MB.' })
  }

  const fileBytes = await file.arrayBuffer()
  if (fileBytes.byteLength > MAX_CLOUDINARY_AUDIO_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'Ukuran audio maksimal 20 MB.' })
  }

  const detectedMimeType = cloudinaryAudioMimeTypeFromBytes(new Uint8Array(fileBytes))
  const declaredMimeType = cloudinaryAudioMimeType(file.type)
  if (
    !detectedMimeType
    || !declaredMimeType
    || declaredMimeType !== detectedMimeType
  ) {
    throw createError({ statusCode: 415, statusMessage: 'Pilih file MP3, M4A, OGG, atau WAV yang valid.' })
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
    const url = await uploadCloudinaryAudio({
      credentials,
      folder,
      fileBytes,
      mimeType: detectedMimeType,
    })
    return { url }
  } catch (error) {
    logOperationalError(event, 'cloudinary.audio_upload_failed', error, {
      provider: 'cloudinary',
      operation: 'upload',
    }, [credentials.apiKey, credentials.apiSecret])
    throw createError({
      statusCode: 502,
      statusMessage: 'Audio belum dapat diunggah ke Cloudinary. Coba lagi.',
    })
  }
})
