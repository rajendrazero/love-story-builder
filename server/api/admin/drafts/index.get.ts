import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/admin-auth'

interface AdminDraftRow {
  id: string
  title: string
  couple_names: string
  published_slug: string | null
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const result = await database.prepare(
    `SELECT d.id, c.title, c.couple_names, d.published_slug, d.created_at, d.updated_at
     FROM story_drafts d
     JOIN story_content c ON c.id = d.id
     ORDER BY d.updated_at DESC LIMIT 200`,
  ).all<AdminDraftRow>()

  return {
    drafts: result.results.map(row => ({
      id: row.id,
      title: row.title || 'Draft tanpa judul',
      coupleNames: row.couple_names,
      publishedSlug: row.published_slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  }
})
