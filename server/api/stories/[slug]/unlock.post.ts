import { createError, defineEventHandler, getRouterParam, readBody, setResponseHeader } from 'h3'
import { unlockStorySchema } from '#shared/schema/story'
import { requireDatabase } from '../../../utils/cloudflare'
import { enforceRateLimit } from '../../../utils/rate-limit'
import { getStoryContent } from '../../../utils/story-content'
import { verifyStoryPassword } from '../../../utils/story-password'
import { isValidStorySlug } from '#shared/story-slug'

interface ProtectedStoryRow {
  content_id: string
  password_salt: string | null
  password_hash: string | null
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const slug = getRouterParam(event, 'slug')
  const parsed = unlockStorySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Masukkan sandi yang valid.' })
  }
  if (!slug || !isValidStorySlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  await enforceRateLimit(event, 'story-unlock', 5, 900, slug)

  const database = requireDatabase(event)
  const row = await database
    .prepare('SELECT content_id, password_salt, password_hash FROM stories WHERE slug = ? AND is_active = 1')
    .bind(slug)
    .first<ProtectedStoryRow>()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  if (Boolean(row.password_salt) !== Boolean(row.password_hash)) {
    throw createError({ statusCode: 500, statusMessage: 'Konfigurasi sandi cerita tidak lengkap.' })
  }
  if (
    row.password_salt
    && row.password_hash
    && !await verifyStoryPassword(parsed.data.password, row.password_salt, row.password_hash)
  ) {
    throw createError({ statusCode: 401, statusMessage: 'Sandi yang kamu masukkan belum tepat.' })
  }
  const story = await getStoryContent(database, row.content_id)
  if (!story) {
    throw createError({ statusCode: 500, statusMessage: 'Konten cerita tidak ditemukan.' })
  }
  return { story }
})
