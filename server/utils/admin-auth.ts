import { createError, getHeader, type H3Event } from 'h3'
import { getAppEnv } from './cloudflare'
import { AccessTokenError, verifyAccessToken, type AccessJwk } from './access-token'

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
  const teamDomain = env.ACCESS_TEAM_DOMAIN?.trim().toLowerCase()
  const audience = env.ACCESS_AUD?.trim()
  const allowlist = env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()).filter(Boolean) ?? []
  if (!teamDomain || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(teamDomain) || !audience || !allowlist.length) {
    throw createError({ statusCode: 503, statusMessage: 'Login admin belum dikonfigurasi.' })
  }

  const token = getHeader(event, 'cf-access-jwt-assertion')
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Login admin Cloudflare Access diperlukan.' })
  }
  try {
    return await verifyAccessToken(token, { teamDomain, audience, allowlist }, getAccessJwk)
  } catch (error) {
    if (error instanceof AccessTokenError) {
      throw createError({ statusCode: error.statusCode, statusMessage: error.message })
    }
    throw error
  }
}
