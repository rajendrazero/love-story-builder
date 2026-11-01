import { createError, type H3Event } from 'h3'
import { getAppEnv, toHex } from './cloudflare'
import { requireUser } from './require-user'

export interface StoryDraftRow {
  id: string
  key_hash: string
  owner_user_id: string | null
  published_slug: string | null
  active_step: number
  editing_slug: string | null
  custom_slug: string | null
  created_at: string
  updated_at: string
}

export async function hashDraftKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return toHex(digest)
}

export function createDraftId(): string {
  return crypto.randomUUID().replaceAll('-', '')
}

export function createDraftKey(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)).buffer)
}

export async function requireOwnedDraft(event: H3Event, id: string, ownerUserId?: string): Promise<StoryDraftRow> {
  if (!/^[a-f0-9]{32}$/.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Draft tidak ditemukan.' })
  }
  const user = ownerUserId ? undefined : await requireUser(event)

  const database = getAppEnv(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'Binding D1 tidak tersedia. Jalankan pnpm dev atau pnpm preview.' })
  }
  const row = await database
    .prepare('SELECT id, key_hash, owner_user_id, published_slug, active_step, editing_slug, custom_slug, created_at, updated_at FROM story_drafts WHERE id = ?')
    .bind(id)
    .first<StoryDraftRow>()
  if (!row || row.owner_user_id !== (ownerUserId ?? user?.id)) {
    throw createError({ statusCode: 404, statusMessage: 'Draft tidak ditemukan.' })
  }

  return row
}
