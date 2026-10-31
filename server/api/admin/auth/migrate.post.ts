import { createError, defineEventHandler } from 'h3'
import { applyAuthMigrations } from '../../../utils/auth-migrations'
import { requireAdmin } from '../../../utils/admin-auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  try {
    return await applyAuthMigrations(event)
  } catch (error) {
    throw createError({
      statusCode: error instanceof Error && error.message.includes('perlu ditinjau') ? 409 : 500,
      statusMessage: error instanceof Error ? `Skema akun tidak dapat disiapkan: ${error.message}` : 'Skema akun tidak dapat disiapkan.',
    })
  }
})
