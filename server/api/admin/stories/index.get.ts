import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/admin-auth'

interface AdminStoryRow {
  slug: string
  title: string
  template_id: string
  couple_names: string
  hero_image: string
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
    `SELECT s.slug, c.title, c.template_id, c.couple_names, c.hero_image,
            s.password_hash, s.published_at, s.is_active
     FROM stories s
     JOIN story_content c ON c.id = s.content_id
     ORDER BY s.published_at DESC LIMIT 200`,
  ).all<AdminStoryRow>()

  return {
    adminEmail,
    stories: result.results.map(row => ({
      slug: row.slug,
      title: row.title,
      story: {
        templateId: row.template_id,
        coupleNames: row.couple_names,
        heroImage: row.hero_image,
      },
      passwordProtected: Boolean(row.password_hash),
      isActive: row.is_active === 1,
      publishedAt: row.published_at,
    })),
  }
})
