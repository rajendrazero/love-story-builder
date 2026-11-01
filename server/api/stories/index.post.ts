import { createError, defineEventHandler, readBody } from 'h3'
import { publishStorySchema } from '#shared/schema/story'
import { requireDatabase } from '../../utils/cloudflare'
import { requireOwnedDraft } from '../../utils/drafts'
import { requireUser } from '../../utils/require-user'
import { enforceRateLimit } from '../../utils/rate-limit'
import { storyContentStatements } from '../../utils/story-content'
import { hashStoryPassword } from '../../utils/story-password'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await enforceRateLimit(event, 'story-publish', 5, 3600, user.id)
  const parsed = publishStorySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data cerita tidak valid.',
      data: parsed.error.flatten(),
    })
  }

  const database = requireDatabase(event)
  const { password, draftId, customSlug, removePassword: _removePassword, ...content } = parsed.data
  const draft = draftId
    ? await requireOwnedDraft(event, draftId, user.id)
    : undefined
  const slug = customSlug ?? crypto.randomUUID().replaceAll('-', '').slice(0, 12)
  const conflict = await database.prepare('SELECT slug FROM stories WHERE slug = ?')
    .bind(slug)
    .first<{ slug: string }>()
  if (conflict) {
    throw createError({ statusCode: 409, statusMessage: 'Link khusus ini sudah dipakai. Pilih link yang lain.' })
  }
  const id = crypto.randomUUID()
  const publishedAt = new Date().toISOString()
  const passwordFields = password ? await hashStoryPassword(password) : undefined

  const statements = [
    ...storyContentStatements(database, id, content),
    database.prepare(
      `INSERT INTO stories (id, slug, content_id, password_salt, password_hash, owner_user_id, published_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      slug,
      id,
      passwordFields?.salt ?? null,
      passwordFields?.hash ?? null,
      user.id,
      publishedAt,
      publishedAt,
    ),
  ]

  if (draft) {
    statements.push(database.prepare(
      'UPDATE story_drafts SET published_slug = ?, updated_at = ? WHERE id = ? AND owner_user_id = ? AND published_slug IS NULL',
    ).bind(slug, publishedAt, draft.id, user.id))
  }
  try {
    await database.batch(statements)
  } catch (error) {
    if (customSlug) {
      const conflict = await database.prepare('SELECT slug FROM stories WHERE slug = ?')
        .bind(slug)
        .first<{ slug: string }>()
      if (conflict) {
        throw createError({ statusCode: 409, statusMessage: 'Link khusus ini sudah dipakai. Pilih link yang lain.' })
      }
    }
    throw error
  }

  return { slug, publishedAt }
})
