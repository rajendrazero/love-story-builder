import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/admin-auth'

interface AdminStoryRow {
  slug: string
  title: string
  payload_json: string
  password_hash: string | null
  published_at: string
  is_active: number
}

export default defineEventHandler(async (event) => {
  const adminEmail = await requireAdmin(event)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }

  const result = await database.prepare(
    'SELECT slug, title, payload_json, password_hash, published_at, is_active FROM stories ORDER BY published_at DESC LIMIT 200',
  ).all<AdminStoryRow>()

  return {
    adminEmail,
    stories: result.results.map(row => ({
      slug: row.slug,
      title: row.title,
      story: JSON.parse(row.payload_json),
      passwordProtected: Boolean(row.password_hash),
      isActive: row.is_active === 1,
      publishedAt: row.published_at,
    })),
  }
})
