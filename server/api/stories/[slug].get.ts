import { createError, defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { requireDatabase } from '../../utils/cloudflare'

interface StoryRow {
  title: string
  payload_json: string
  password_hash: string | null
  is_active: number
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const slug = getRouterParam(event, 'slug')
  if (!slug || !/^[a-f0-9]{12}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  const row = await requireDatabase(event)
    .prepare('SELECT title, payload_json, password_hash, is_active FROM stories WHERE slug = ? AND is_active = 1')
    .bind(slug)
    .first<StoryRow>()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  if (row.password_hash) {
    return { title: row.title, locked: true }
  }
  return { title: row.title, locked: false, story: JSON.parse(row.payload_json) }
})
