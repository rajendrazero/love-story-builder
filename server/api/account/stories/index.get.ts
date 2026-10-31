import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireUser } from '../../../utils/require-user'

interface StoryListRow {
  slug: string
  title: string
  payload_json: string
  password_hash: string | null
  published_at: string
  is_active: number
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const result = await database.prepare(
    'SELECT slug, title, payload_json, password_hash, published_at, is_active FROM stories WHERE owner_user_id = ? ORDER BY published_at DESC LIMIT 100',
  ).bind(user.id).all<StoryListRow>()

  return {
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
