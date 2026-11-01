import { createError, getHeader, getRequestURL, type H3Event } from 'h3'
import { getAppEnv } from './cloudflare'
import { requireUser } from './require-user'
import { getAdminEmailAllowlist, isAdminEmailAllowed } from './admin-allowlist'
import { AccessTokenError, verifyAccessToken, type AccessJwk } from './access-token'
import { verifyBootstrapToken } from './bootstrap-token'

interface AccessJwks {
  keys?: AccessJwk[]
}

let cachedJwks: { keys: AccessJwk[], expiresAt: number } | undefined

async function getAccessJwk(teamDomain: string, keyId: string): Promise<AccessJwk> {
  const now = Date.now()
  if (!cachedJwks || cachedJwks.expiresAt <= now) {
    const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`)
    if (!response.ok) {
      throw createError({ statusCode: 503, statusMessage: 'Tidak dapat memverifikasi login Cloudflare Access.' })
    }
    const body = await response.json() as AccessJwks
    if (!body.keys?.length) {
      throw createError({ statusCode: 503, statusMessage: 'Kunci verifikasi Cloudflare Access tidak tersedia.' })
    }
    cachedJwks = { keys: body.keys, expiresAt: now + 5 * 60 * 1000 }
  }

  const jwk = cachedJwks.keys.find(key => key.kid === keyId)
  if (!jwk) {
    throw createError({ statusCode: 401, statusMessage: 'Login admin Cloudflare Access diperlukan.' })
  }
  return jwk
}

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
  return email
}

export async function requireAdminBootstrap(event: H3Event): Promise<string> {
  const env = getAppEnv(event)
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim().toLowerCase()
  const audience = env.ACCESS_AUD?.trim()
  const allowlist = getAdminEmailAllowlist(env.ADMIN_EMAILS)
  if (!allowlist.length) {
    throw createError({ statusCode: 503, statusMessage: 'Migrasi awal akun admin belum dikonfigurasi.' })
  }

  const accessToken = getHeader(event, 'cf-access-jwt-assertion')
  if (
    accessToken
    && teamDomain
    && /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(teamDomain)
    && audience
  ) {
    try {
      return await verifyAccessToken(accessToken, { teamDomain, audience, allowlist }, getAccessJwk)
    } catch (error) {
      if (error instanceof AccessTokenError) {
        throw createError({ statusCode: error.statusCode, statusMessage: error.message })
      }
      throw error
    }
  }

  const bootstrapToken = getHeader(event, 'x-admin-bootstrap-token')
  const requestURL = getRequestURL(event)
  const localHostname = ['localhost', '127.0.0.1', '::1'].includes(requestURL.hostname)
  if (requestURL.protocol !== 'https:' && !localHostname) {
    throw createError({ statusCode: 400, statusMessage: 'Token setup admin hanya boleh dikirim melalui HTTPS.' })
  }
  if (!await verifyBootstrapToken(bootstrapToken, env.ADMIN_BOOTSTRAP_TOKEN?.trim())) {
    throw createError({
      statusCode: env.ADMIN_BOOTSTRAP_TOKEN ? 401 : 503,
      statusMessage: env.ADMIN_BOOTSTRAP_TOKEN
        ? 'Token setup admin tidak valid.'
        : 'Konfigurasikan Cloudflare Access atau ADMIN_BOOTSTRAP_TOKEN sementara untuk setup awal.',
    })
  }
  return allowlist[0]!
}
