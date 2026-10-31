import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'
import { requireUser } from '../../utils/require-user'

interface DraftListRow {
  id: string
  payload_json: string
  published_slug: string | null
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const result = await database.prepare(
    'SELECT id, payload_json, published_slug, created_at, updated_at FROM story_drafts WHERE owner_user_id = ? ORDER BY updated_at DESC LIMIT 100',
  ).bind(user.id).all<DraftListRow>()

  return {
    drafts: result.results.map((row) => {
      const payload = JSON.parse(row.payload_json) as { title?: string, coupleNames?: string }
      return {
        id: row.id,
        title: payload.title || 'Draft tanpa judul',
        coupleNames: payload.coupleNames || '',
        publishedSlug: row.published_slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    }),
  }
})
