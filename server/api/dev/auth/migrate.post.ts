import { createError, defineEventHandler, getRequestURL } from 'h3'
import { applyAuthMigrations } from '../../../utils/auth-migrations'
import { getAppEnv } from '../../../utils/cloudflare'

export default defineEventHandler(async (event) => {
  const env = getAppEnv(event)
  const hostname = getRequestURL(event).hostname
  if (
    env.AUTH_DEV_MIGRATION !== 'true'
    || !['localhost', '127.0.0.1', '::1'].includes(hostname)
  ) {
    throw createError({ statusCode: 404, statusMessage: 'Rute tidak ditemukan.' })
  }
  try {
    return await applyAuthMigrations(event)
  } catch (error) {
    throw createError({
      statusCode: error instanceof Error && error.message.includes('perlu ditinjau') ? 409 : 500,
      statusMessage: error instanceof Error ? `Skema akun tidak dapat disiapkan: ${error.message}` : 'Skema akun tidak dapat disiapkan.',
    })
  }
})
