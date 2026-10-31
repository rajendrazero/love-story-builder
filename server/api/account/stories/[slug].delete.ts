import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireUser } from '../../../utils/require-user'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-f0-9]{12}$/.test(slug)) {
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
       AND (published_slug = ? OR json_extract(payload_json, '$.editingSlug') = ?)`,
  ).bind(user.id, slug, slug).run()
  return { deleted: true }
})
