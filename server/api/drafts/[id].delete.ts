import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'
import { requireOwnedDraft } from '../../utils/drafts'
import { requireUser } from '../../utils/require-user'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id') ?? ''
  await requireOwnedDraft(event, id, user.id)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  await database.prepare(
    'DELETE FROM story_drafts WHERE id = ? AND owner_user_id = ?',
  ).bind(id, user.id).run()
  return { deleted: true }
})
