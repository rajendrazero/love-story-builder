import { createError, defineEventHandler, readBody } from 'h3'
import { publishStorySchema } from '#shared/schema/story'
import { requireDatabase, toHex } from '../../utils/cloudflare'
import { requireOwnedDraft } from '../../utils/drafts'
import { requireUser } from '../../utils/require-user'
import { enforceRateLimit } from '../../utils/rate-limit'

async function hashPassword(password: string): Promise<{ salt: string, hash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120_000 },
    key,
    256,
  )
  return { salt: toHex(saltBytes.buffer), hash: toHex(bits) }
}

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
  const { password, draftId, removePassword: _removePassword, ...content } = parsed.data
  const draft = draftId
    ? await requireOwnedDraft(event, draftId, user.id)
    : undefined
  const slug = crypto.randomUUID().replaceAll('-', '').slice(0, 12)
  const id = crypto.randomUUID()
  const publishedAt = new Date().toISOString()
  const passwordFields = password ? await hashPassword(password) : undefined

  await database.prepare(
    `INSERT INTO stories (id, slug, title, payload_json, password_salt, password_hash, owner_user_id, published_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    slug,
    content.title,
    JSON.stringify(content),
    passwordFields?.salt ?? null,
    passwordFields?.hash ?? null,
    user.id,
    publishedAt,
    publishedAt,
  ).run()

  if (draft) {
    await database.prepare(
      'UPDATE story_drafts SET published_slug = ?, updated_at = ? WHERE id = ? AND owner_user_id = ? AND published_slug IS NULL',
    ).bind(slug, publishedAt, draft.id, user.id).run()
  }

  return { slug, publishedAt }
})
