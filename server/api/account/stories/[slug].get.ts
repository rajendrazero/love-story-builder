import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireUser } from '../../../utils/require-user'
import { getStoryContent } from '../../../utils/story-content'
import { isValidStorySlug } from '#shared/story-slug'

interface OwnedStoryRow {
  slug: string
  content_id: string
  password_hash: string | null
  published_at: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidStorySlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const story = await database.prepare(
    'SELECT slug, content_id, password_hash, published_at FROM stories WHERE slug = ? AND owner_user_id = ?',
  ).bind(slug, user.id).first<OwnedStoryRow>()
  if (!story) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  const content = await getStoryContent(database, story.content_id)
  if (!content) {
    throw createError({ statusCode: 500, statusMessage: 'Konten cerita tidak ditemukan.' })
  }
  return {
    slug: story.slug,
    title: content.title,
    story: content,
    passwordProtected: Boolean(story.password_hash),
    publishedAt: story.published_at,
  }
})
