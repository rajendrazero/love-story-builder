import { createError, defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { requireDatabase } from '../../utils/cloudflare'
import { getStoryContent } from '../../utils/story-content'
import { isValidStorySlug } from '#shared/story-slug'

interface StoryRow {
  title: string
  content_id: string
  password_hash: string | null
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const slug = getRouterParam(event, 'slug')
  if (!slug || !isValidStorySlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  const database = requireDatabase(event)
  const row = await database
    .prepare(
      `SELECT c.title, s.content_id, s.password_hash
       FROM stories s
       JOIN story_content c ON c.id = s.content_id
       WHERE s.slug = ? AND s.is_active = 1`,
    )
    .bind(slug)
    .first<StoryRow>()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }

  if (row.password_hash) {
    return { title: row.title, locked: true }
  }
  const story = await getStoryContent(database, row.content_id)
  if (!story) {
    throw createError({ statusCode: 500, statusMessage: 'Konten cerita tidak ditemukan.' })
  }
  return { title: row.title, locked: false, story }
})
