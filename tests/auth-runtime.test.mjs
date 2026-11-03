import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

function resolveAuthTestModule(specifier, context, nextResolve) {
  if (specifier === 'h3') {
    return {
      url: new URL('./support/h3-test-double.mjs', import.meta.url).href,
      shortCircuit: true,
    }
  }

  if (specifier.startsWith('.') && context.parentURL?.startsWith(new URL('../', import.meta.url).href)) {
    const resolvedUrl = new URL(specifier, context.parentURL)
    if (!resolvedUrl.pathname.endsWith('.ts') && !resolvedUrl.pathname.endsWith('.mjs')) {
      const typedUrl = new URL(`${resolvedUrl.href}.ts`)
      if (existsSync(fileURLToPath(typedUrl))) {
        return { url: typedUrl.href, shortCircuit: true }
      }
    }
  }

  return nextResolve(specifier, context)
}

registerHooks({ resolve: resolveAuthTestModule })

const [{ default: authHandler }, { createAuth }, { requireDatabase }, { requireUser }, { requireAdmin }] = await Promise.all([
  import('../server/api/auth/[...all].ts'),
  import('../server/utils/auth.ts'),
  import('../server/utils/cloudflare.ts'),
  import('../server/utils/require-user.ts'),
  import('../server/utils/admin-auth.ts'),
])

function createD1Database(sqlite) {
  function prepare(query) {
    let parameters = []
    return {
      bind(...values) {
        parameters = values
        return this
      },
      async all() {
        const results = sqlite.prepare(query).all(...parameters)
        const meta = sqlite.prepare(
          'SELECT changes() AS changes, last_insert_rowid() AS last_row_id',
        ).get()
        return {
          results,
          meta: {
            changes: Number(meta.changes),
            last_row_id: Number(meta.last_row_id),
          },
        }
      },
      async first() {
        return sqlite.prepare(query).get(...parameters) ?? null
      },
      async run() {
        const result = sqlite.prepare(query).run(...parameters)
        return {
          meta: {
            changes: Number(result.changes),
            last_row_id: Number(result.lastInsertRowid),
          },
        }
      },
    }
  }

  return {
    async exec(query) {
      sqlite.exec(query)
      return { count: 0, duration: 0 }
    },
    prepare,
    async batch(statements) {
      return Promise.all(statements.map(statement => statement.all()))
    },
  }
}

function createEvent(database, path, method = 'GET', body, headers = {}, origin = 'https://localhost:8787') {
  const request = new Request(`${origin}${path}`, {
    method,
    headers: {
      'cf-connecting-ip': '127.0.0.1',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  return {
    request,
    path,
    method,
    headers: Object.fromEntries(request.headers),
    context: {
      cloudflare: {
        env: {
          DB: database,
          BETTER_AUTH_SECRET: 'test-only-secret-with-at-least-thirty-two-characters',
          BETTER_AUTH_URL: 'https://localhost:8787',
          TURNSTILE_SECRET_KEY: 'test-only-turnstile-secret',
        },
      },
    },
  }
}

test('Better Auth uses the D1-compatible binding for login, session, logout, and secure cookies', async () => {
  const sqlite = new DatabaseSync(':memory:')
  const database = createD1Database(sqlite)
  const originalFetch = globalThis.fetch

  try {
    sqlite.exec(readFileSync(new URL('../migrations/0008_create_better_auth_tables.sql', import.meta.url), 'utf8'))

    const auth = createAuth(createEvent(database, '/api/auth/get-session'))
    const context = await auth.$context
    const passwordHash = await context.password.hash('correct-horse-battery-staple')
    sqlite.prepare(
      'INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, ?, ?)',
    ).run('auth-user-1', 'Test User', 'auth-user@example.test', Date.now(), Date.now())
    sqlite.prepare(
      'INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run('auth-account-1', 'auth-user-1', 'credential', 'auth-user-1', passwordHash, Date.now(), Date.now())

    globalThis.fetch = async (input) => {
      assert.equal(new URL(String(input)).hostname, 'challenges.cloudflare.com')
      return Response.json({ success: true, hostname: 'localhost' })
    }

    const invalidCredentials = await authHandler(createEvent(
      database,
      '/api/auth/sign-in/email',
      'POST',
      { email: 'auth-user@example.test', password: 'incorrect-password' },
      { Origin: 'https://localhost:8787', 'x-captcha-response': 'test-token' },
    ))
    assert.equal(invalidCredentials.status, 401)
    const invalidCredentialsBody = await invalidCredentials.text()
    assert.doesNotMatch(invalidCredentialsBody, /incorrect-password|correct-horse-battery-staple/)

    const login = await authHandler(createEvent(
      database,
      '/api/auth/sign-in/email',
      'POST',
      { email: 'auth-user@example.test', password: 'correct-horse-battery-staple' },
      { Origin: 'https://localhost:8787', 'x-captcha-response': 'test-token' },
    ))
    assert.equal(login.status, 200)
    assert.ok(
      Number(sqlite.prepare('SELECT COUNT(*) AS count FROM rateLimit').get().count) > 0,
      'auth endpoint rate limiting should persist through the D1 adapter',
    )

    const sessionCookie = login.headers.getSetCookie()
      .find(cookie => /(?:__Secure-)?better-auth\.session_token=/.test(cookie))
    assert.ok(sessionCookie)
    assert.match(sessionCookie, /;\s*HttpOnly/i)
    assert.match(sessionCookie, /;\s*Secure/i)
    assert.match(sessionCookie, /;\s*SameSite=Lax/i)
    const cookieHeader = sessionCookie.split(';', 1)[0]

    const sessionResponse = await authHandler(createEvent(
      database,
      '/api/auth/get-session',
      'GET',
      undefined,
      { Cookie: cookieHeader },
    ))
    assert.equal(sessionResponse.status, 200)
    const session = await sessionResponse.json()
    assert.equal(session.user.email, 'auth-user@example.test')

    const authenticatedEvent = createEvent(
      database,
      '/api/account/me',
      'GET',
      undefined,
      { Cookie: cookieHeader },
    )
    assert.equal((await requireUser(authenticatedEvent)).id, 'auth-user-1')
    await assert.rejects(
      requireUser(createEvent(database, '/api/account/me')),
      error => error.statusCode === 401,
    )
    await assert.rejects(
      requireAdmin(createEvent(
        database,
        '/api/admin/stories',
        'GET',
        undefined,
        { Cookie: cookieHeader },
      )),
      error => error.statusCode === 503,
    )
    const nonAdminEvent = createEvent(
      database,
      '/api/admin/stories',
      'GET',
      undefined,
      { Cookie: cookieHeader },
    )
    nonAdminEvent.context.cloudflare.env.ADMIN_EMAILS = 'another-admin@example.test'
    await assert.rejects(
      requireAdmin(nonAdminEvent),
      error => error.statusCode === 403,
    )
    const adminEvent = createEvent(
      database,
      '/api/admin/stories',
      'GET',
      undefined,
      { Cookie: cookieHeader },
    )
    adminEvent.context.cloudflare.env.ADMIN_EMAILS = 'auth-user@example.test'
    assert.equal(await requireAdmin(adminEvent), 'auth-user@example.test')

    const rejectedCrossOriginLogout = await authHandler(createEvent(
      database,
      '/api/auth/sign-out',
      'POST',
      {},
      { Cookie: cookieHeader, Origin: 'https://attacker.example' },
    ))
    assert.equal(rejectedCrossOriginLogout.status, 403)

    const logout = await authHandler(createEvent(
      database,
      '/api/auth/sign-out',
      'POST',
      {},
      { Cookie: cookieHeader, Origin: 'https://localhost:8787' },
    ))
    assert.equal(logout.status, 200)

    const expiredSessionResponse = await authHandler(createEvent(
      database,
      '/api/auth/get-session',
      'GET',
      undefined,
      { Cookie: cookieHeader },
    ))
    assert.equal(expiredSessionResponse.status, 200)
    assert.equal(await expiredSessionResponse.json(), null)
  } finally {
    globalThis.fetch = originalFetch
    sqlite.close()
  }
})

test('Better Auth returns service unavailable for missing runtime configuration', () => {
  const event = createEvent({ prepare() {} }, '/api/auth/get-session')
  event.context.cloudflare.env.BETTER_AUTH_SECRET = ''
  assert.throws(
    () => createAuth(event),
    error => error.statusCode === 503 && /BETTER_AUTH_SECRET/.test(error.statusMessage),
  )

  event.context.cloudflare.env.BETTER_AUTH_SECRET = 'test-only-secret-with-at-least-thirty-two-characters'
  event.context.cloudflare.env.TURNSTILE_SECRET_KEY = ''
  assert.throws(
    () => createAuth(event),
    error => error.statusCode === 503 && /TURNSTILE_SECRET_KEY/.test(error.statusMessage),
  )
  event.context.cloudflare.env.TURNSTILE_SECRET_KEY = 'test-only-turnstile-secret'
  event.context.cloudflare.env.BETTER_AUTH_URL = 'not-a-valid-url'
  assert.throws(
    () => createAuth(event),
    error => error.statusCode === 503 && /BETTER_AUTH_URL/.test(error.statusMessage),
  )

  event.context.cloudflare.env.BETTER_AUTH_URL = 'http://stories.example.com'
  assert.throws(
    () => createAuth(event),
    error => error.statusCode === 503 && /HTTPS/.test(error.statusMessage),
  )

  const missingProductionURL = createEvent(
    { prepare() {} },
    '/api/auth/get-session',
    'GET',
    undefined,
    {},
    'https://stories.example.com',
  )
  delete missingProductionURL.context.cloudflare.env.BETTER_AUTH_URL
  assert.throws(
    () => createAuth(missingProductionURL),
    error => error.statusCode === 503 && /BETTER_AUTH_URL/.test(error.statusMessage),
  )

  const localURLOnPublicRequest = createEvent(
    { prepare() {} },
    '/api/auth/get-session',
    'GET',
    undefined,
    {},
    'https://stories.example.com',
  )
  localURLOnPublicRequest.context.cloudflare.env.BETTER_AUTH_URL = 'http://localhost:8787'
  assert.throws(
    () => createAuth(localURLOnPublicRequest),
    error => error.statusCode === 503 && /development lokal/.test(error.statusMessage),
  )

  assert.throws(
    () => requireDatabase(event),
    error => error.statusCode === 503 && /Binding D1/.test(error.statusMessage),
  )
  assert.throws(
    () => requireDatabase(createEvent({}, '/api/auth/get-session')),
    error => error.statusCode === 503 && /Binding D1/.test(error.statusMessage),
  )

  const incompatibleEvent = createEvent({
    prepare() {},
    batch() {},
  }, '/api/auth/get-session')
  assert.throws(
    () => requireDatabase(incompatibleEvent),
    error => error.statusCode === 503 && /Binding D1/.test(error.statusMessage),
  )
})
