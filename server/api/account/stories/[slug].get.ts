import { createError, defineEventHandler, getRouterParam } from 'h3'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireUser } from '../../../utils/require-user'

interface OwnedStoryRow {
  slug: string
  title: string
  payload_json: string
  password_hash: string | null
  published_at: string
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!/^[a-f0-9]{12}$/.test(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const story = await database.prepare(
    'SELECT slug, title, payload_json, password_hash, published_at FROM stories WHERE slug = ? AND owner_user_id = ?',
  ).bind(slug, user.id).first<OwnedStoryRow>()
  if (!story) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  return {
    slug: story.slug,
    title: story.title,
    story: JSON.parse(story.payload_json),
    passwordProtected: Boolean(story.password_hash),
    publishedAt: story.published_at,
  }
})
