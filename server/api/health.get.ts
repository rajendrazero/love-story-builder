import { defineEventHandler, setResponseHeader, setResponseStatus } from 'h3'
import { getAppEnv } from '../utils/cloudflare'
import { logOperationalError } from '../utils/observability'

const authTables = ['user', 'session', 'account', 'verification', 'rateLimit', 'user_roles']

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const database = getAppEnv(event).DB
  if (!database) {
    setResponseStatus(event, 503)
    logOperationalError(event, 'health.database_unavailable', new Error('D1 binding unavailable'))
    return { status: 'degraded', checks: { database: 'error', authSchema: 'unknown' } }
  }

  try {
    const result = await database.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (?, ?, ?, ?, ?, ?)",
    ).bind(...authTables).all<{ name: string }>()
    const existing = new Set(result.results.map(row => row.name))
    const missing = authTables.filter(table => !existing.has(table))
    if (missing.length) {
      setResponseStatus(event, 503)
      logOperationalError(event, 'health.auth_schema_incomplete', new Error('Required auth tables missing'), {
        missingTables: missing.join(','),
      })
      return { status: 'degraded', checks: { database: 'ok', authSchema: 'error' } }
    }
    return { status: 'ok', checks: { database: 'ok', authSchema: 'ok' } }
  } catch (error) {
    setResponseStatus(event, 503)
    logOperationalError(event, 'health.database_query_failed', error)
    return { status: 'degraded', checks: { database: 'error', authSchema: 'unknown' } }
  }
})
