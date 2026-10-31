import { createError, type H3Event } from 'h3'

interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<unknown>
}

export interface AppEnv {
  DB?: {
    prepare(query: string): D1Statement
  }
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

export function requireDatabase(event: H3Event) {
  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Binding D1 tidak tersedia. Jalankan pnpm dev atau pnpm preview, bukan pnpm dev:ui.',
    })
  }
  return database
}

export function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
