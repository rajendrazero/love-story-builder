import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { getAppEnv } from '../../utils/cloudflare'
import { isCloudinaryImageUrl } from '../../utils/cloudinary-library'
import { requireUser } from '../../utils/require-user'
import { enforceRateLimit } from '../../utils/rate-limit'

const uploadedImageSchema = z.object({
  url: z.string().url().max(2048),
}).strict()

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'upload-library-save', 60, 3600, user.id)
  const parsed = uploadedImageSchema.safeParse(await readBody(event))
  if (!parsed.success || !isCloudinaryImageUrl(parsed.data?.url)) {
    throw createError({ statusCode: 400, statusMessage: 'URL foto Cloudinary tidak valid.' })
  }

  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  await database.prepare(
    'INSERT INTO uploaded_images (owner_user_id, url, created_at) VALUES (?, ?, ?) ON CONFLICT(owner_user_id, url) DO NOTHING',
  ).bind(user.id, parsed.data.url, new Date().toISOString()).run()

  return { saved: true }
})
