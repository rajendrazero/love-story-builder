import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { storyDraftSchema } from '#shared/schema/draft'
import { getAppEnv } from '../../utils/cloudflare'
import { requireOwnedDraft } from '../../utils/drafts'
import { enforceRateLimit } from '../../utils/rate-limit'
import { storyContentStatements } from '../../utils/story-content'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const existing = await requireOwnedDraft(event, id)
  await enforceRateLimit(event, 'draft-save', 120, 60, existing.owner_user_id ?? '')
  if (existing.published_slug) {
    throw createError({ statusCode: 409, statusMessage: 'Cerita ini sudah diterbitkan dan draft tidak dapat diubah.' })
  }

  const parsed = storyDraftSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Isi draft tidak valid.',
      data: parsed.error.flatten(),
    })
  }

  const updatedAt = new Date().toISOString()
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia. Jalankan pnpm dev atau pnpm preview.' })
  }
  const result = await database.batch([
    ...storyContentStatements(database, id, parsed.data),
    database.prepare(
      'UPDATE story_drafts SET active_step = ?, editing_slug = ?, custom_slug = ?, updated_at = ? WHERE id = ? AND owner_user_id = ? AND published_slug IS NULL',
    ).bind(
      parsed.data.activeStep ?? 0,
      parsed.data.editingSlug ?? null,
      parsed.data.customSlug ?? null,
      updatedAt,
      id,
      existing.owner_user_id,
    ),
  ])
  if (result[result.length - 1]?.meta?.changes === 0) {
    throw createError({ statusCode: 409, statusMessage: 'Draft sudah tidak dapat diubah.' })
  }

  return { id, updatedAt }
})
