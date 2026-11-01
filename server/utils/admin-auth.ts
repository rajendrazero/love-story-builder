import { createError, type H3Event } from 'h3'
import { getAppEnv, requireDatabase } from './cloudflare'
import { requireUser } from './require-user'
import { getAdminEmailAllowlist, isAdminEmailAllowed } from './admin-allowlist'
import { seedUserRole } from './admin-role'

export async function requireAdmin(event: H3Event): Promise<string> {
  const env = getAppEnv(event)
  const allowlist = getAdminEmailAllowlist(env.ADMIN_EMAILS)
  if (!allowlist.length) {
    throw createError({ statusCode: 503, statusMessage: 'Login admin belum dikonfigurasi.' })
  }

  const user = await requireUser(event)
  const email = user.email.trim().toLowerCase()
  if (!isAdminEmailAllowed(email, allowlist)) {
    throw createError({ statusCode: 403, statusMessage: 'Akun ini tidak diizinkan mengelola cerita.' })
  }

  const role = await seedUserRole(requireDatabase(event), user.id, email, env.ADMIN_EMAILS)
  if (role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Role akun ini belum diizinkan mengelola cerita.' })
  }

  return email
}
