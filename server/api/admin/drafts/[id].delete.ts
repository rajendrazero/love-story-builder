import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f0-9]{32}$/.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Draft tidak ditemukan.' })
  }
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const result = await database.prepare('DELETE FROM story_drafts WHERE id = ?').bind(id).run()
  if (result.meta?.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Draft tidak ditemukan.' })
  }
  return { deleted: true }
})
