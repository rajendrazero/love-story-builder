import { createError, defineEventHandler, getRouterParam, readBody, setResponseHeader } from 'h3'
import { unlockStorySchema } from '#shared/schema/story'
import { requireDatabase, toHex } from '../../../utils/cloudflare'
import { enforceRateLimit } from '../../../utils/rate-limit'

interface ProtectedStoryRow {
  payload_json: string
  password_salt: string | null
  password_hash: string | null
}

function fromHex(value: string): ArrayBuffer {
  const buffer = new ArrayBuffer(value.length / 2)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16)
  }
  return buffer
}

function hashesMatch(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) return false
  let difference = 0
  for (let index = 0; index < actual.length; index += 1) {
    difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  }
  return difference === 0
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const slug = getRouterParam(event, 'slug')
  const parsed = unlockStorySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Masukkan sandi yang valid.' })
  }
  if (!slug || !/^[a-f0-9]{12}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  await enforceRateLimit(event, 'story-unlock', 5, 900, slug)

  const row = await requireDatabase(event)
    .prepare('SELECT payload_json, password_salt, password_hash FROM stories WHERE slug = ? AND is_active = 1')
    .bind(slug)
    .first<ProtectedStoryRow>()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  if (!row.password_salt || !row.password_hash) {
    return { story: JSON.parse(row.payload_json) }
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(parsed.data.password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(row.password_salt), iterations: 120_000 },
    key,
    256,
  )
  if (!hashesMatch(toHex(bits), row.password_hash)) {
    throw createError({ statusCode: 401, statusMessage: 'Sandi yang kamu masukkan belum tepat.' })
  }
  return { story: JSON.parse(row.payload_json) }
})
