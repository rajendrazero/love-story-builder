import { createError, defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { requireDatabase, getAppEnv } from '../../utils/cloudflare'
import { cloudinaryPublicIdFromLibraryUrl } from '../../utils/cloudinary-library'
import { destroyCloudinaryImage } from '../../utils/cloudinary-delete'
import {
  cloudinaryUploadFolderForOwner,
  resolveCloudinaryCredentials,
} from '../../utils/cloudinary-signature'
import { logOperationalError } from '../../utils/observability'
import { enforceRateLimit } from '../../utils/rate-limit'
import { requireUser } from '../../utils/require-user'

const deleteImageSchema = z.object({
  url: z.string().url().max(2048),
}).strict()

interface ReferencedImageRow {
  referenced: number
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'upload-library-delete', 60, 3600, user.id)
  // Nitro's Cloudflare adapter does not forward DELETE request bodies.
  const parsed = deleteImageSchema.safeParse(getQuery(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'URL foto Cloudinary tidak valid.' })
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
  const publicId = cloudinaryPublicIdFromLibraryUrl(parsed.data.url, credentials.cloudName, folder)
  if (!publicId) {
    throw createError({ statusCode: 400, statusMessage: 'URL foto Cloudinary tidak valid.' })
  }

  const database = requireDatabase(event)
  const savedImage = await database.prepare(
    'SELECT url FROM uploaded_images WHERE owner_user_id = ? AND url = ?',
  ).bind(user.id, parsed.data.url).first<{ url: string }>()
  const referencedImage = await database.prepare(
    `SELECT 1 AS referenced
     WHERE EXISTS (
       SELECT 1
       FROM story_content AS content
       WHERE (
         content.hero_image = ?
         OR content.greeting_image = ?
         OR content.second_image = ?
         OR content.final_image = ?
       )
       AND (
         EXISTS (SELECT 1 FROM story_drafts AS draft WHERE draft.id = content.id)
         OR EXISTS (SELECT 1 FROM stories AS story WHERE story.content_id = content.id)
       )
     )
     OR EXISTS (
       SELECT 1
       FROM story_gallery_items AS gallery
       WHERE gallery.url = ?
       AND (
         EXISTS (SELECT 1 FROM story_drafts AS draft WHERE draft.id = gallery.content_id)
         OR EXISTS (SELECT 1 FROM stories AS story WHERE story.content_id = gallery.content_id)
       )
     )
     OR EXISTS (
       SELECT 1
       FROM story_chapters AS chapter
       WHERE chapter.image_url = ?
       AND (
         EXISTS (SELECT 1 FROM story_drafts AS draft WHERE draft.id = chapter.content_id)
         OR EXISTS (SELECT 1 FROM stories AS story WHERE story.content_id = chapter.content_id)
       )
     )
     LIMIT 1`,
  ).bind(
    parsed.data.url,
    parsed.data.url,
    parsed.data.url,
    parsed.data.url,
    parsed.data.url,
    parsed.data.url,
  ).first<ReferencedImageRow>()

  if (referencedImage) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Foto sedang digunakan di draft atau cerita. Hapus foto dari konten terlebih dahulu.',
    })
  }

  if (!savedImage) {
    throw createError({ statusCode: 404, statusMessage: 'Foto tidak ditemukan di koleksi akun ini.' })
  }

  try {
    await destroyCloudinaryImage({ credentials, publicId })
  } catch (error) {
    logOperationalError(event, 'cloudinary.asset_delete_failed', error, {
      provider: 'cloudinary',
      operation: 'delete',
    }, [credentials.apiKey, credentials.apiSecret])
    throw createError({
      statusCode: 502,
      statusMessage: 'Foto belum dapat dihapus dari Cloudinary. Coba lagi.',
    })
  }

  await database.prepare(
    'DELETE FROM uploaded_images WHERE owner_user_id = ? AND url = ?',
  ).bind(user.id, parsed.data.url).run()

  return { deleted: true }
})
