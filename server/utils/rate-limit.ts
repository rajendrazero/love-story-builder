import { createError, getHeader, setResponseHeader, type H3Event } from 'h3'
import { requireDatabase, toHex } from './cloudflare'

interface RateLimitRow {
  request_count: number
}

export async function enforceRateLimit(
  event: H3Event,
  scope: string,
  limit: number,
  windowSeconds: number,
  identity = '',
) {
  const ip = getHeader(event, 'cf-connecting-ip')?.trim()
  if (!ip || ip.length > 64) {
    throw createError({ statusCode: 503, statusMessage: 'Alamat jaringan tidak tersedia untuk pemeriksaan batas permintaan.' })
  }

  const now = Math.floor(Date.now() / 1000)
  const windowStartedAt = Math.floor(now / windowSeconds) * windowSeconds
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${scope}\u0000${ip}\u0000${identity}`),
  )
  const rateKey = toHex(digest)
  const database = requireDatabase(event)
  const result = await database.prepare(
    `INSERT INTO api_rate_limits (rate_key, window_started_at, request_count)
     VALUES (?, ?, 1)
     ON CONFLICT (rate_key, window_started_at)
     DO UPDATE SET request_count = request_count + 1
     RETURNING request_count`,
  ).bind(rateKey, windowStartedAt).first<RateLimitRow>()

  if (!result) {
    throw createError({ statusCode: 503, statusMessage: 'Pemeriksaan batas permintaan belum tersedia.' })
  }

  if (windowStartedAt % 60 === 0 && result.request_count === 1) {
    await database.prepare('DELETE FROM api_rate_limits WHERE window_started_at < ?')
      .bind(now - 86_400)
      .run()
  }

  if (result.request_count > limit) {
    const retryAfter = Math.max(1, windowStartedAt + windowSeconds - now)
    setResponseHeader(event, 'Retry-After', retryAfter)
    throw createError({
      statusCode: 429,
      statusMessage: 'Terlalu banyak permintaan. Coba lagi setelah jeda singkat.',
      data: { retryAfterSeconds: retryAfter },
    })
  }
}
