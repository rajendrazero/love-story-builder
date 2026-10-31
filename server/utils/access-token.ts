interface AccessJwtHeader {
  alg?: string
  kid?: string
}

interface AccessJwtClaims {
  aud?: string | string[]
  email?: string
  exp?: number
  iat?: number
  iss?: string
  nbf?: number
}

export interface AccessJwk extends JsonWebKey {
  kid?: string
}

export interface AccessTokenOptions {
  teamDomain: string
  audience: string
  allowlist: string[]
}

export class AccessTokenError extends Error {
  readonly statusCode: 401 | 403

  constructor(statusCode: 401 | 403, message: string) {
    super(message)
    this.name = 'AccessTokenError'
    this.statusCode = statusCode
  }
}

function invalidAccessToken(): never {
  throw new AccessTokenError(401, 'Login admin Cloudflare Access diperlukan.')
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  const buffer = new ArrayBuffer(decoded.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }
  return buffer
}

function decodeJsonPart<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T
}

export async function verifyAccessToken(
  token: string,
  options: AccessTokenOptions,
  resolveJwk: (teamDomain: string, keyId: string) => Promise<AccessJwk>,
): Promise<string> {
  const parts = token.split('.')
  if (parts.length !== 3) invalidAccessToken()

  let header: AccessJwtHeader
  let claims: AccessJwtClaims
  try {
    header = decodeJsonPart(parts[0]!)
    claims = decodeJsonPart(parts[1]!)
  } catch {
    invalidAccessToken()
  }
  if (header.alg !== 'RS256' || !header.kid || !claims.email) invalidAccessToken()

  const now = Math.floor(Date.now() / 1000)
  const tokenAudiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (
    claims.iss !== `https://${options.teamDomain}`
    || !tokenAudiences.includes(options.audience)
    || typeof claims.exp !== 'number'
    || claims.exp <= now
    || (typeof claims.nbf === 'number' && claims.nbf > now + 60)
    || (typeof claims.iat === 'number' && claims.iat > now + 60)
  ) {
    invalidAccessToken()
  }

  const jwk = await resolveJwk(options.teamDomain, header.kid)
  const publicKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const signatureValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    decodeBase64Url(parts[2]!),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  )
  if (!signatureValid) invalidAccessToken()

  const email = claims.email.toLowerCase()
  if (!options.allowlist.includes(email)) {
    throw new AccessTokenError(403, 'Akun ini tidak diizinkan mengelola cerita.')
  }
  return email
}
