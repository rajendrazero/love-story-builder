import { createError, defineEventHandler, getRouterParam } from 'h3'
import { storyDraftSchema } from '#shared/schema/draft'
import { requireOwnedDraft } from '../../utils/drafts'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const row = await requireOwnedDraft(event, id)
  let payload: unknown
  try {
    payload = JSON.parse(row.payload_json)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'Draft tersimpan tidak dapat dibaca.' })
  }
  const parsed = storyDraftSchema.safeParse(payload)
  if (!parsed.success) {
    throw createError({ statusCode: 500, statusMessage: 'Draft tersimpan tidak valid.' })
  }

  return { id: row.id, draft: parsed.data, publishedSlug: row.published_slug, updatedAt: row.updated_at }
})
