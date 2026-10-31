import { createError, defineEventHandler, readBody } from 'h3'
import { publishStorySchema } from '#shared/schema/story'
import { requireDatabase, toHex } from '../../utils/cloudflare'

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
  const parsed = publishStorySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Data cerita tidak valid.',
      data: parsed.error.flatten(),
    })
  }

  const database = requireDatabase(event)
  const { password, ...content } = parsed.data
  const slug = crypto.randomUUID().replaceAll('-', '').slice(0, 12)
  const id = crypto.randomUUID()
  const publishedAt = new Date().toISOString()
  const passwordFields = password ? await hashPassword(password) : undefined

  await database.prepare(
    `INSERT INTO stories (id, slug, title, payload_json, password_salt, password_hash, published_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    slug,
    content.title,
    JSON.stringify(content),
    passwordFields?.salt ?? null,
    passwordFields?.hash ?? null,
    publishedAt,
    publishedAt,
  ).run()

  return { slug, publishedAt }
})
