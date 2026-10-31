import { createError, defineEventHandler, getRouterParam } from 'h3'
import { storyDraftSchema } from '#shared/schema/draft'
import { getAppEnv } from '../../utils/cloudflare'
import { requireOwnedDraft } from '../../utils/drafts'
import { getStoryContent } from '../../utils/story-content'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const row = await requireOwnedDraft(event, id)
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const content = await getStoryContent(database, row.id)
  if (!content) {
    throw createError({ statusCode: 500, statusMessage: 'Konten draft tidak ditemukan.' })
  }
  const parsed = storyDraftSchema.safeParse({
    ...content,
    activeStep: row.active_step,
    ...(row.editing_slug ? { editingSlug: row.editing_slug } : {}),
  })
  if (!parsed.success) {
    throw createError({ statusCode: 500, statusMessage: 'Draft tersimpan tidak valid.' })
  }

  return { id: row.id, draft: parsed.data, publishedSlug: row.published_slug, updatedAt: row.updated_at }
})
