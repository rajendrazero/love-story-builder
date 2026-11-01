import { createError, defineEventHandler, getRouterParam, readBody, setResponseHeader } from 'h3'
import { z } from 'zod'
import { getAppEnv } from '../../../utils/cloudflare'
import { requireAdmin } from '../../../utils/admin-auth'
import { isValidStorySlug } from '#shared/story-slug'

const visibilitySchema = z.object({ active: z.boolean() }).strict()

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug') ?? ''
  if (!isValidStorySlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  const parsed = visibilitySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Status cerita tidak valid.' })
  }
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia.' })
  }
  const existing = await database.prepare(
    'SELECT slug FROM stories WHERE slug = ?',
  ).bind(slug).first<{ slug: string }>()
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Cerita tidak ditemukan.' })
  }
  await database.prepare(
    'UPDATE stories SET is_active = ? WHERE slug = ?',
  ).bind(parsed.data.active ? 1 : 0, slug).run()
  return { slug, isActive: parsed.data.active }
})
