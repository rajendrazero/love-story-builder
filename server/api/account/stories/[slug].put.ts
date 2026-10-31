import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { updateStorySchema } from '#shared/schema/story'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireOwnedDraft } from '../../../utils/drafts'
import { requireUser } from '../../../utils/require-user'
import { enforceRateLimit } from '../../../utils/rate-limit'
import { storyContentStatements } from '../../../utils/story-content'
import { hashStoryPassword } from '../../../utils/story-password'

interface ExistingStoryRow {
  content_id: string
  password_salt: string | null
  password_hash: string | null
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'story-update', 20, 600, user.id)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-f0-9]{12}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  const parsed = updateStorySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data cerita tidak valid.',
      data: parsed.error.flatten(),
    })
  }

  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const existing = await database.prepare(
    'SELECT content_id, password_salt, password_hash FROM stories WHERE slug = ? AND owner_user_id = ?',
  ).bind(slug, user.id).first<ExistingStoryRow>()
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  const { password, draftId, removePassword, ...content } = parsed.data
  const draft = draftId ? await requireOwnedDraft(event, draftId, user.id) : undefined
  if (draft?.published_slug && draft.published_slug !== slug) {
    throw createError({ statusCode: 409, statusMessage: 'Draft ini terhubung ke cerita lain.' })
  }
  const passwordFields = password ? await hashStoryPassword(password) : undefined
  const passwordSalt = removePassword ? null : passwordFields?.salt ?? existing.password_salt
  const passwordHash = removePassword ? null : passwordFields?.hash ?? existing.password_hash
  const publishedAt = new Date().toISOString()
  const statements = [
    ...storyContentStatements(database, existing.content_id, content),
    ...(draft ? storyContentStatements(database, draft.id, content) : []),
    database.prepare(
      'UPDATE stories SET password_salt = ?, password_hash = ?, published_at = ? WHERE slug = ? AND owner_user_id = ?',
    ).bind(passwordSalt, passwordHash, publishedAt, slug, user.id),
  ]

  if (draft) {
    statements.push(database.prepare(
      'UPDATE story_drafts SET published_slug = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?',
    ).bind(slug, publishedAt, draft.id, user.id))
  }
  await database.batch(statements)
  return { slug, publishedAt }
})
