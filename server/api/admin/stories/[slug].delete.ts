import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/admin-auth'
import { isValidStorySlug } from '#shared/story-slug'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug || !isValidStorySlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const results = await database.batch([
    database.prepare(
      `DELETE FROM story_drafts
       WHERE (published_slug = ? OR editing_slug = ?)
         AND EXISTS (SELECT 1 FROM stories WHERE slug = ?)`,
    ).bind(slug, slug, slug),
    database.prepare('DELETE FROM stories WHERE slug = ?').bind(slug),
  ])
  if (results[1]?.meta?.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  return { deleted: true }
})
