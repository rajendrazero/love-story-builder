import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireUser } from '../../../utils/require-user'
import { isValidStorySlug } from '#shared/story-slug'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidStorySlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const results = await database.batch([
    database.prepare(
      `DELETE FROM story_drafts
       WHERE owner_user_id = ?
         AND (published_slug = ? OR editing_slug = ?)
         AND EXISTS (
           SELECT 1 FROM stories WHERE slug = ? AND owner_user_id = ?
         )`,
    ).bind(user.id, slug, slug, slug, user.id),
    database.prepare(
      'DELETE FROM stories WHERE slug = ? AND owner_user_id = ?',
    ).bind(slug, user.id),
  ])
  if (results[1]?.meta?.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  return { deleted: true }
})
