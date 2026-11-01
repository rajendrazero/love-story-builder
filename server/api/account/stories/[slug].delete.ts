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
  const result = await database.prepare(
    'DELETE FROM stories WHERE slug = ? AND owner_user_id = ?',
  ).bind(slug, user.id).run()
  if (result.meta?.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  await database.prepare(
    `DELETE FROM story_drafts
     WHERE owner_user_id = ?
       AND (published_slug = ? OR editing_slug = ?)`,
  ).bind(user.id, slug, slug).run()
  return { deleted: true }
})
