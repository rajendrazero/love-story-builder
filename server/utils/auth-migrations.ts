import { getMigrations } from 'better-auth/db/migration'
import { createAuth } from './auth'
import type { H3Event } from 'h3'

export async function applyAuthMigrations(event: H3Event) {
  const migration = await getMigrations(createAuth(event).options)
  const pending = {
    create: migration.toBeCreated.map(table => table.table),
    add: migration.toBeAdded.map(table => table.table),
    indexes: migration.toBeAddedIndexes.map(index => index.name),
  }
  if (migration.unsafeChanges.length || migration.schemaProblems.length) {
    throw new Error(`Skema autentikasi perlu ditinjau sebelum migrasi: ${[...migration.unsafeChanges, ...migration.schemaProblems].join('; ')}`)
  }
  if (!pending.create.length && !pending.add.length && !pending.indexes.length) {
    return { migrated: false, pending }
  }
  await migration.runMigrations()
  return { migrated: true, pending }
}
