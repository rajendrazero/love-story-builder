import { createError, defineEventHandler } from 'h3'
import { getAppEnv } from '../../utils/cloudflare'
import { createDraftId, createDraftKey, hashDraftKey } from '../../utils/drafts'
import { requireUser } from '../../utils/require-user'
import { enforceRateLimit } from '../../utils/rate-limit'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'draft-create', 20, 3600, user.id)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia. Jalankan pnpm dev atau pnpm preview.' })
  }

  const id = createDraftId()
  const key = createDraftKey()
  const now = new Date().toISOString()
  await database.prepare(
    'INSERT INTO story_drafts (id, key_hash, owner_user_id, payload_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(id, await hashDraftKey(key), user.id, '{}', now, now).run()

  return { id, updatedAt: now }
})
