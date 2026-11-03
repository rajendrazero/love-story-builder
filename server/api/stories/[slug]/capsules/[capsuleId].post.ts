import { createError, defineEventHandler, getRouterParam, readBody, setResponseHeader } from 'h3'
import { z } from 'zod'
import { requireDatabase } from '../../../../utils/cloudflare'
import { enforceRateLimit } from '../../../../utils/rate-limit'
import { getStoryContent } from '../../../../utils/story-content'
import { verifyStoryPassword } from '../../../../utils/story-password'
import { isValidStorySlug } from '#shared/story-slug'

interface StoryCapsuleRow {
  content_id: string
  password_salt: string | null
  password_hash: string | null
}

const capsuleAccessSchema = z.object({
  password: z.string().max(128).optional(),
}).strict()

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const slug = getRouterParam(event, 'slug')
  const capsuleId = getRouterParam(event, 'capsuleId')
  const parsed = capsuleAccessSchema.safeParse((await readBody(event)) ?? {})
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Data akses kapsul tidak valid.' })
  }
  if (!slug || !isValidStorySlug(slug) || capsuleId !== 'memory-capsule') {
    throw createError({ statusCode: 404, statusMessage: 'Kapsul kenangan tidak ditemukan.' })
  }
  await enforceRateLimit(event, 'story-capsule', 10, 900, slug)

  const database = requireDatabase(event)
  const row = await database.prepare(
    `SELECT content_id, password_salt, password_hash
     FROM stories
     WHERE slug = ? AND is_active = 1`,
  ).bind(slug).first<StoryCapsuleRow>()
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Kapsul kenangan tidak ditemukan.' })
  }
  if (Boolean(row.password_salt) !== Boolean(row.password_hash)) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi sandi cerita tidak lengkap.' })
  }
  if (row.password_hash) {
    if (!parsed.data.password) {
      throw createError({ statusCode: 401, statusMessage: 'Masukkan sandi cerita untuk membuka kapsul.' })
    }
    if (!row.password_salt || !await verifyStoryPassword(parsed.data.password, row.password_salt, row.password_hash)) {
      throw createError({ statusCode: 401, statusMessage: 'Sandi cerita belum tepat.' })
    }
  }

  const story = await getStoryContent(database, row.content_id)
  const capsule = story?.sectionContent?.memoryCapsule
  if (!story || !capsule?.title || !capsule.unlockDate || !capsule.message) {
    throw createError({ statusCode: 404, statusMessage: 'Kapsul kenangan tidak ditemukan.' })
  }

  const unlockAt = Date.parse(`${capsule.unlockDate}T00:00:00.000Z`)
  if (!Number.isFinite(unlockAt)) {
    throw createError({ statusCode: 500, statusMessage: 'Tanggal buka kapsul tidak valid.' })
  }
  if (unlockAt > Date.now()) {
    throw createError({ statusCode: 403, statusMessage: 'Kapsul ini belum waktunya dibuka.' })
  }

  return {
    title: capsule.title,
    message: capsule.message,
    unlockDate: capsule.unlockDate,
  }
})
