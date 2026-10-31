import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { updateStorySchema } from '#shared/schema/story'
import { getAppEnv, toHex } from '../../../utils/cloudflare'
import { requireOwnedDraft } from '../../../utils/drafts'
import { requireUser } from '../../../utils/require-user'
import { enforceRateLimit } from '../../../utils/rate-limit'

interface ExistingStoryRow {
  password_salt: string | null
  password_hash: string | null
}

async function hashPassword(password: string): Promise<{ salt: string, hash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120_000 },
    key,
    256,
  )
  return { salt: toHex(saltBytes.buffer), hash: toHex(bits) }
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
    'SELECT password_salt, password_hash FROM stories WHERE slug = ? AND owner_user_id = ?',
  ).bind(slug, user.id).first<ExistingStoryRow>()
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  const { password, draftId, removePassword, ...content } = parsed.data
  const draft = draftId ? await requireOwnedDraft(event, draftId, user.id) : undefined
  if (draft?.published_slug && draft.published_slug !== slug) {
    throw createError({ statusCode: 409, statusMessage: 'Draft ini terhubung ke cerita lain.' })
  }
  const passwordFields = password ? await hashPassword(password) : undefined
  const passwordSalt = removePassword ? null : passwordFields?.salt ?? existing.password_salt
  const passwordHash = removePassword ? null : passwordFields?.hash ?? existing.password_hash
  const publishedAt = new Date().toISOString()
  await database.prepare(
    'UPDATE stories SET title = ?, payload_json = ?, password_salt = ?, password_hash = ?, published_at = ? WHERE slug = ? AND owner_user_id = ?',
  ).bind(
    content.title,
    JSON.stringify(content),
    passwordSalt,
    passwordHash,
    publishedAt,
    slug,
    user.id,
  ).run()

  if (draft) {
    await database.prepare(
      'UPDATE story_drafts SET published_slug = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?',
    ).bind(slug, publishedAt, draft.id, user.id).run()
  }
  return { slug, publishedAt }
})
