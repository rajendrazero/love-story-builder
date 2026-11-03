import { createError, type H3Event } from 'h3'

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
  run(): Promise<{ meta?: { changes?: number } }>
}

interface D1Result {
  meta?: { changes?: number }
  results?: Record<string, unknown>[]
}

export interface D1Database {
  exec(query: string): Promise<{ count: number; duration: number }>
  prepare(query: string): D1Statement
  batch(statements: D1Statement[]): Promise<D1Result[]>
}

export interface AppEnv {
  DB?: D1Database
  ADMIN_EMAILS?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  GMAIL_SENDER_EMAIL?: string
  GOOGLE_OAUTH_CLIENT_ID?: string
  GOOGLE_OAUTH_CLIENT_SECRET?: string
  GOOGLE_OAUTH_REFRESH_TOKEN?: string
  NUXT_PUBLIC_TURNSTILE_SITE_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  CLOUDINARY_CLOUD_NAME?: string
  CLOUDINARY_API_KEY?: string
  CLOUDINARY_API_SECRET?: string
}

export function getAppEnv(event: H3Event): AppEnv {
  const context = event.context as typeof event.context & {
    cloudflare?: { env?: AppEnv }
  }
  return context.cloudflare?.env ?? {}
}

function isD1Database(database: unknown): database is D1Database {
  if (typeof database !== 'object' || database === null) return false
  return 'exec' in database
    && typeof database.exec === 'function'
    && 'prepare' in database
    && typeof database.prepare === 'function'
    && 'batch' in database
    && typeof database.batch === 'function'
}

export function requireDatabase(event: H3Event) {
  const database: unknown = getAppEnv(event).DB
  if (!isD1Database(database)) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Binding D1 tidak tersedia atau tidak kompatibel. Jalankan pnpm dev atau pnpm preview, bukan pnpm dev:ui.',
    })
  }
  return database
}

export function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
