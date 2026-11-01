import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { resolve as resolveApiTestModule } from './support/api-test-loader.mjs'

registerHooks({ resolve: resolveApiTestModule })

const [{ default: createDraft }, { default: getDraft }, { default: updateDraft }, { default: deleteDraft }] = await Promise.all([
  import('../server/api/drafts/index.post.ts'),
  import('../server/api/drafts/[id].get.ts'),
  import('../server/api/drafts/[id].put.ts'),
  import('../server/api/drafts/[id].delete.ts'),
])
const [{ default: publishStory }, { default: getPublicStory }, { default: unlockStory }] = await Promise.all([
  import('../server/api/stories/index.post.ts'),
  import('../server/api/stories/[slug].get.ts'),
  import('../server/api/stories/[slug]/unlock.post.ts'),
])
const [{ default: getAccountStories }, { default: getOwnedStory }, { default: updateStory }, { default: updateStoryVisibility }, { default: deleteStory }] = await Promise.all([
  import('../server/api/account/stories/index.get.ts'),
  import('../server/api/account/stories/[slug].get.ts'),
  import('../server/api/account/stories/[slug].put.ts'),
  import('../server/api/account/stories/[slug].patch.ts'),
  import('../server/api/account/stories/[slug].delete.ts'),
])
const [{ default: getAdminStories }, { default: updateAdminStoryVisibility }, { default: deleteAdminStory }, { default: deleteAdminDraft }] = await Promise.all([
  import('../server/api/admin/stories/index.get.ts'),
  import('../server/api/admin/stories/[slug].patch.ts'),
  import('../server/api/admin/stories/[slug].delete.ts'),
  import('../server/api/admin/drafts/[id].delete.ts'),
])
const [{ default: createUploadSignature }, { default: saveUploadedImage }] = await Promise.all([
  import('../server/api/uploads/signature.post.ts'),
  import('../server/api/uploads/library.post.ts'),
])
const { hashStoryPassword } = await import('../server/utils/story-password.ts')
const { requireUser: requireVerifiedUser } = await import('../server/utils/require-user.ts')
const { cloudinaryUploadFolderForOwner } = await import('../server/utils/cloudinary-signature.ts')
const { CLOUDINARY_UPLOAD_PRESET } = await import('../shared/utils/cloudinary-upload-policy.ts')

const migrations = [
  '0001_create_stories.sql',
  '0002_create_story_drafts.sql',
  '0003_add_account_ownership.sql',
  '0004_add_story_visibility.sql',
  '0005_create_api_rate_limits.sql',
  '0006_normalize_story_content.sql',
  '0007_cascade_story_content.sql',
  '0008_create_better_auth_tables.sql',
  '0009_seed_existing_user_roles.sql',
  '0010_add_draft_custom_slug.sql',
  '0011_create_uploaded_images.sql',
]

const users = {
  owner: { id: 'owner-1', email: 'owner@example.test', emailVerified: true },
  other: { id: 'owner-2', email: 'other@example.test', emailVerified: true },
}

const storyPayload = {
  templateId: 'editorial-rose',
  cursorPreset: 'system',
  title: 'A story about us',
  coupleNames: 'Alya & Bima',
  date: 'Since 2022',
  heroImage: 'https://example.test/hero.jpg',
  greetingImage: 'https://example.test/greeting.jpg',
  greetingVideoUrl: '',
  greetingText: 'A note for you',
  gallery: [{ url: 'https://example.test/gallery.jpg', caption: 'Our day' }],
  secondImage: 'https://example.test/second.jpg',
  detailTitle: 'The beginning',
  detailText: 'We met and started a life together.',
  storyPages: [{ title: 'First chapter', text: 'Our first memory.', image: 'https://example.test/page.jpg' }],
  finalImage: 'https://example.test/final.jpg',
  finalMessage: 'I would choose you again.',
  musicUrl: '',
}

globalThis.useRuntimeConfig = event => event.context.runtimeConfig ?? {}

function createDatabase() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec('PRAGMA foreign_keys = ON')
  let failNextBatchAt

  const database = {
    exec(query) {
      sqlite.exec(query)
      return Promise.resolve({ count: 0, duration: 0 })
    },
    prepare(query) {
      let parameters = []
      return {
        query,
        bind(...values) {
          parameters = values
          return this
        },
        first() {
          return sqlite.prepare(query).get(...parameters) ?? null
        },
        all() {
          return { results: sqlite.prepare(query).all(...parameters) }
        },
        run() {
          const result = sqlite.prepare(query).run(...parameters)
          return { meta: { changes: Number(result.changes) } }
        },
      }
    },
    batch(statements) {
      sqlite.exec('BEGIN')
      try {
        const results = statements.map((statement, index) => {
          if (failNextBatchAt === index) {
            failNextBatchAt = undefined
            throw new Error('Simulated D1 batch failure')
          }
          return statement.run()
        })
        sqlite.exec('COMMIT')
        return results
      } catch (error) {
        sqlite.exec('ROLLBACK')
        throw error
      }
    },
    failNextBatchAt(index) {
      failNextBatchAt = index
    },
    close() {
      sqlite.close()
    },
  }

  for (const migration of migrations.slice(0, 8)) {
    sqlite.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'))
  }
  const addUser = sqlite.prepare(
    'INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 1, 1, 1)',
  )
  addUser.run(users.owner.id, 'Owner', users.owner.email)
  addUser.run(users.other.id, 'Other', users.other.email)
  addUser.run('admin-1', 'Admin', 'admin@example.test')
  for (const migration of migrations.slice(8)) {
    sqlite.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), 'utf8'))
  }
  sqlite.prepare('UPDATE user_roles SET role = ? WHERE user_id = ?').run('admin', 'admin-1')

  return database
}

function createEvent(database, {
  method = 'GET',
  path = '/',
  params = {},
  user = users.owner,
  admin = false,
  body,
  ip = '192.0.2.10',
  environment = {},
  runtimeConfig = {
    cloudinaryCloudName: 'upload-cloud',
    cloudinaryApiKey: 'test-api-key',
    cloudinaryApiSecret: 'test-api-secret',
  },
} = {}) {
  return {
    request: new Request(`https://localhost${path}`, {
      method,
      headers: { 'cf-connecting-ip': ip },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    context: {
      params,
      body,
      testUser: user,
      testAdmin: admin,
      cloudflare: { env: { DB: database, ...environment } },
      runtimeConfig,
      responseHeaders: new Map(),
    },
  }
}

function assertHttpError(statusCode) {
  return error => error.statusCode === statusCode
}

function seedContent(database, id, payload = storyPayload) {
  const values = [
    id,
    payload.templateId,
    payload.cursorPreset,
    payload.title,
    payload.coupleNames,
    payload.date,
    payload.heroImage,
    payload.greetingImage,
    payload.greetingVideoUrl,
    payload.greetingText,
    payload.secondImage,
    payload.detailTitle,
    payload.detailText,
    payload.finalImage,
    payload.finalMessage,
    payload.musicUrl,
  ]
  database.prepare(
    `INSERT INTO story_content (
       id, template_id, cursor_preset, title, couple_names, date_label,
       hero_image, greeting_image, greeting_video_url, greeting_text,
       second_image, detail_title, detail_text, final_image, final_message, music_url
     ) VALUES (${values.map(() => '?').join(', ')})`,
  ).bind(...values).run()
  for (const [position, photo] of payload.gallery.entries()) {
    database.prepare(
      'INSERT INTO story_gallery_items (content_id, position, url, caption) VALUES (?, ?, ?, ?)',
    ).bind(id, position, photo.url, photo.caption).run()
  }
  for (const [position, chapter] of payload.storyPages.entries()) {
    database.prepare(
      'INSERT INTO story_chapters (content_id, position, title, body, image_url) VALUES (?, ?, ?, ?, ?)',
    ).bind(id, position, chapter.title, chapter.text, chapter.image).run()
  }
}

function seedStory(database, {
  id = 'story-1',
  slug = 'our-little-story',
  ownerId = users.owner.id,
  active = true,
  password,
} = {}) {
  seedContent(database, id)
  database.prepare(
    `INSERT INTO stories (
       id, slug, content_id, password_salt, password_hash, owner_user_id, published_at, created_at, is_active
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    id,
    slug,
    id,
    password?.salt ?? null,
    password?.hash ?? null,
    ownerId,
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00.000Z',
    active ? 1 : 0,
  ).run()
}

test('draft create, load, update, delete, and owner isolation use authenticated ownership', async () => {
  const database = createDatabase()
  try {
    const created = await createDraft(createEvent(database, { method: 'POST', path: '/api/drafts' }))
    assert.match(created.id, /^[a-f0-9]{32}$/)
    assert.equal(typeof created.updatedAt, 'string')

    const loaded = await getDraft(createEvent(database, {
      path: `/api/drafts/${created.id}`,
      params: { id: created.id },
    }))
    assert.equal(loaded.id, created.id)
    assert.equal(loaded.publishedSlug, null)

    const draftBody = {
      activeStep: 2,
      title: 'A saved draft',
      coupleNames: 'Alya & Bima',
      heroImage: 'https://example.test/hero.jpg',
    }
    const saved = await updateDraft(createEvent(database, {
      method: 'PUT',
      path: `/api/drafts/${created.id}`,
      params: { id: created.id },
      body: draftBody,
    }))
    assert.equal(saved.id, created.id)

    const reloaded = await getDraft(createEvent(database, {
      path: `/api/drafts/${created.id}`,
      params: { id: created.id },
    }))
    assert.equal(reloaded.draft.activeStep, 2)
    assert.equal(reloaded.draft.title, draftBody.title)

    await assert.rejects(
      getDraft(createEvent(database, {
        path: `/api/drafts/${created.id}`,
        params: { id: created.id },
        user: users.other,
      })),
      assertHttpError(404),
    )
    await assert.rejects(
      deleteDraft(createEvent(database, {
        method: 'DELETE',
        path: `/api/drafts/${created.id}`,
        params: { id: created.id },
        user: users.other,
      })),
      assertHttpError(404),
    )
    assert.ok(database.prepare('SELECT id FROM story_drafts WHERE id = ?').bind(created.id).first())

    assert.deepEqual(await deleteDraft(createEvent(database, {
      method: 'DELETE',
      path: `/api/drafts/${created.id}`,
      params: { id: created.id },
    })), { deleted: true })
    assert.equal(database.prepare('SELECT id FROM story_drafts WHERE id = ?').bind(created.id).first(), null)
  } finally {
    database.close()
  }
})

test('publishing validates content, links the draft, and rejects duplicate slugs', async () => {
  const database = createDatabase()
  try {
    const created = await createDraft(createEvent(database, { method: 'POST', path: '/api/drafts' }))
    const response = await publishStory(createEvent(database, {
      method: 'POST',
      path: '/api/stories',
      body: { ...storyPayload, draftId: created.id, customSlug: 'our-little-story' },
    }))
    assert.equal(response.slug, 'our-little-story')
    assert.equal(typeof response.publishedAt, 'string')
    assert.equal(
      database.prepare('SELECT published_slug FROM story_drafts WHERE id = ?').bind(created.id).first().published_slug,
      response.slug,
    )
    assert.ok(database.prepare('SELECT slug FROM stories WHERE slug = ?').bind(response.slug).first())

    await assert.rejects(
      publishStory(createEvent(database, {
        method: 'POST',
        path: '/api/stories',
        body: { ...storyPayload, customSlug: response.slug },
        ip: '192.0.2.11',
      })),
      assertHttpError(409),
    )
    await assert.rejects(
      publishStory(createEvent(database, {
        method: 'POST',
        path: '/api/stories',
        body: { ...storyPayload, title: '' },
        ip: '192.0.2.12',
      })),
      assertHttpError(400),
    )
  } finally {
    database.close()
  }
})

test('public story reads hide password-protected content and omit password hashes', async () => {
  const database = createDatabase()
  try {
    seedStory(database, { id: 'public-story', slug: 'public-story' })
    const password = await hashStoryPassword('private story password')
    seedStory(database, { id: 'locked-story', slug: 'locked-story', password })
    seedStory(database, { id: 'inactive-story', slug: 'inactive-story', active: false })

    const publicResponse = await getPublicStory(createEvent(database, {
      path: '/api/stories/public-story',
      params: { slug: 'public-story' },
    }))
    assert.equal(publicResponse.locked, false)
    assert.equal(publicResponse.story.title, storyPayload.title)
    assert.equal('password_hash' in publicResponse, false)

    const lockedResponse = await getPublicStory(createEvent(database, {
      path: '/api/stories/locked-story',
      params: { slug: 'locked-story' },
    }))
    assert.deepEqual(lockedResponse, { title: storyPayload.title, locked: true })

    await assert.rejects(
      getPublicStory(createEvent(database, {
        path: '/api/stories/inactive-story',
        params: { slug: 'inactive-story' },
      })),
      assertHttpError(404),
    )
  } finally {
    database.close()
  }
})

test('protected story unlock checks the password and returns story content only after success', async () => {
  const database = createDatabase()
  try {
    const password = await hashStoryPassword('private story password')
    seedStory(database, { id: 'locked-story', slug: 'locked-story', password })

    await assert.rejects(
      unlockStory(createEvent(database, {
        method: 'POST',
        path: '/api/stories/locked-story/unlock',
        params: { slug: 'locked-story' },
        body: { password: 'wrong password' },
      })),
      assertHttpError(401),
    )

    const response = await unlockStory(createEvent(database, {
      method: 'POST',
      path: '/api/stories/locked-story/unlock',
      params: { slug: 'locked-story' },
      body: { password: 'private story password' },
    }))
    assert.equal(response.story.title, storyPayload.title)
  } finally {
    database.close()
  }
})

test('account story reads and updates are owner-scoped', async () => {
  const database = createDatabase()
  try {
    seedStory(database, { id: 'owned-story', slug: 'owned-story' })

    const ownedStories = await getAccountStories(createEvent(database, { path: '/api/account/stories' }))
    assert.equal(ownedStories.stories.length, 1)
    assert.equal(ownedStories.stories[0].slug, 'owned-story')

    await assert.rejects(
      getOwnedStory(createEvent(database, {
        path: '/api/account/stories/owned-story',
        params: { slug: 'owned-story' },
        user: users.other,
      })),
      assertHttpError(404),
    )
    await assert.rejects(
      updateStory(createEvent(database, {
        method: 'PUT',
        path: '/api/account/stories/owned-story',
        params: { slug: 'owned-story' },
        user: users.other,
        body: storyPayload,
      })),
      assertHttpError(404),
    )

    const updated = await updateStory(createEvent(database, {
      method: 'PUT',
      path: '/api/account/stories/owned-story',
      params: { slug: 'owned-story' },
      body: { ...storyPayload, title: 'Updated story', customSlug: 'new-story-link' },
    }))
    assert.equal(updated.slug, 'new-story-link')
    assert.equal(
      database.prepare('SELECT title FROM story_content WHERE id = ?').bind('owned-story').first().title,
      'Updated story',
    )

    await assert.rejects(
      updateStoryVisibility(createEvent(database, {
        method: 'PATCH',
        path: '/api/account/stories/new-story-link',
        params: { slug: 'new-story-link' },
        user: users.other,
        body: { active: false },
      })),
      assertHttpError(404),
    )
    const visibility = await updateStoryVisibility(createEvent(database, {
      method: 'PATCH',
      path: '/api/account/stories/new-story-link',
      params: { slug: 'new-story-link' },
      body: { active: false },
    }))
    assert.deepEqual(visibility, { slug: 'new-story-link', isActive: false })
    assert.equal(
      database.prepare('SELECT is_active FROM stories WHERE slug = ?').bind('new-story-link').first().is_active,
      0,
    )
  } finally {
    database.close()
  }
})

test('admin endpoints require admin authorization and expose only summary fields', async () => {
  const database = createDatabase()
  try {
    seedStory(database, { id: 'admin-story', slug: 'admin-story' })
    await assert.rejects(
      getAdminStories(createEvent(database, { path: '/api/admin/stories', admin: false })),
      assertHttpError(403),
    )

    const response = await getAdminStories(createEvent(database, { path: '/api/admin/stories', admin: true }))
    assert.equal(response.stories[0].slug, 'admin-story')
    assert.equal('password_hash' in response.stories[0], false)
    const visibility = await updateAdminStoryVisibility(createEvent(database, {
      method: 'PATCH',
      path: '/api/admin/stories/admin-story',
      params: { slug: 'admin-story' },
      admin: true,
      body: { active: false },
    }))
    assert.deepEqual(visibility, { slug: 'admin-story', isActive: false })
    await assert.rejects(
      updateAdminStoryVisibility(createEvent(database, {
        method: 'PATCH',
        path: '/api/admin/stories/admin-story',
        params: { slug: 'admin-story' },
        admin: false,
        body: { active: true },
      })),
      assertHttpError(403),
    )

    const draftId = 'b'.repeat(32)
    seedContent(database, draftId)
    database.prepare(
      'INSERT INTO story_drafts (id, key_hash, owner_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    ).bind(draftId, 'hash', users.owner.id, '2026-01-01', '2026-01-01').run()
    await assert.rejects(
      deleteAdminDraft(createEvent(database, {
        method: 'DELETE',
        path: `/api/admin/drafts/${draftId}`,
        params: { id: draftId },
        admin: false,
      })),
      assertHttpError(403),
    )
    assert.deepEqual(await deleteAdminDraft(createEvent(database, {
      method: 'DELETE',
      path: `/api/admin/drafts/${draftId}`,
      params: { id: draftId },
      admin: true,
    })), { deleted: true })
  } finally {
    database.close()
  }
})

test('account and admin story deletion keep story and related drafts atomic', async () => {
  for (const [handler, admin] of [[deleteStory, false], [deleteAdminStory, true]]) {
    const database = createDatabase()
    try {
      seedStory(database, { id: 'delete-story', slug: 'delete-story' })
      const draftId = 'a'.repeat(32)
      seedContent(database, draftId)
      database.prepare(
        'INSERT INTO story_drafts (id, key_hash, owner_user_id, published_slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).bind(draftId, 'hash', users.owner.id, 'delete-story', '2026-01-01', '2026-01-01').run()
      database.failNextBatchAt(1)

      await assert.rejects(
        handler(createEvent(database, {
          method: 'DELETE',
          path: '/api/stories/delete-story',
          params: { slug: 'delete-story' },
          admin,
        })),
        /Simulated D1 batch failure/,
      )
      assert.ok(database.prepare('SELECT slug FROM stories WHERE slug = ?').bind('delete-story').first())
      assert.ok(database.prepare('SELECT id FROM story_drafts WHERE id = ?').bind(draftId).first())

      const deleted = await handler(createEvent(database, {
        method: 'DELETE',
        path: '/api/stories/delete-story',
        params: { slug: 'delete-story' },
        admin,
      }))
      assert.deepEqual(deleted, { deleted: true })
      assert.equal(database.prepare('SELECT slug FROM stories WHERE slug = ?').bind('delete-story').first(), null)
      assert.equal(database.prepare('SELECT id FROM story_drafts WHERE id = ?').bind(draftId).first(), null)
    } finally {
      database.close()
    }
  }
})

test('API auth catch-all delegates each auth request to the configured Better Auth handler', () => {
  const source = readFileSync(new URL('../server/api/auth/[...all].ts', import.meta.url), 'utf8')
  assert.match(source, /createAuth\(event\)\.handler\(toWebRequest\(event\)\)/)
})

test('auth configuration failures return service unavailable instead of internal server error', () => {
  const source = readFileSync(new URL('../server/utils/auth.ts', import.meta.url), 'utf8')
  assert.match(source, /if \(!secret \|\| secret\.length < 32\)\s*\{\s*throw createError\(\{\s*statusCode: 503,/)
  assert.match(source, /if \(!turnstileSecret\)\s*\{\s*throw createError\(\{\s*statusCode: 503,/)
})

test('server session helper rejects missing and unverified users', async () => {
  const database = createDatabase()
  try {
    const event = createEvent(database)
    event.context.authSession = { user: { ...users.owner } }
    assert.equal((await requireVerifiedUser(event)).id, users.owner.id)

    event.context.authSession = { user: { ...users.owner, emailVerified: false } }
    await assert.rejects(requireVerifiedUser(event), assertHttpError(401))

    event.context.authSession = null
    await assert.rejects(requireVerifiedUser(event), assertHttpError(401))
  } finally {
    database.close()
  }
})

test('upload signatures are private, preset-bound, and scoped to the signed-in user', async () => {
  const database = createDatabase()
  try {
    const response = await createUploadSignature(createEvent(database, {
      method: 'POST',
      path: '/api/uploads/signature',
    }))
    const ownerFolder = await cloudinaryUploadFolderForOwner(users.owner.id)

    assert.equal(response.cloudName, 'upload-cloud')
    assert.equal(response.folder, ownerFolder)
    assert.equal(response.uploadPreset, CLOUDINARY_UPLOAD_PRESET)
    assert.equal('apiSecret' in response, false)

    await assert.rejects(
      createUploadSignature(createEvent(database, {
        method: 'POST',
        path: '/api/uploads/signature',
        user: null,
        ip: '192.0.2.20',
      })),
      assertHttpError(401),
    )
  } finally {
    database.close()
  }
})

test('upload-library saves reject arbitrary, foreign-cloud, and cross-user assets', async () => {
  const database = createDatabase()
  try {
    const ownerFolder = await cloudinaryUploadFolderForOwner(users.owner.id)
    const otherOwnerFolder = await cloudinaryUploadFolderForOwner(users.other.id)
    const ownerAssetUrl = `https://res.cloudinary.com/upload-cloud/image/upload/v123/${ownerFolder}/photo.jpg`

    for (const [index, url] of [
      'https://example.test/photo.jpg',
      `https://res.cloudinary.com/other-cloud/image/upload/v123/${ownerFolder}/photo.jpg`,
      `https://res.cloudinary.com/upload-cloud/image/upload/v123/${otherOwnerFolder}/photo.jpg`,
    ].entries()) {
      await assert.rejects(
        saveUploadedImage(createEvent(database, {
          method: 'POST',
          path: '/api/uploads/library',
          body: { url },
          ip: `192.0.2.${30 + index}`,
        })),
        assertHttpError(400),
      )
    }

    await assert.rejects(
      saveUploadedImage(createEvent(database, {
        method: 'POST',
        path: '/api/uploads/library',
        body: { url: ownerAssetUrl },
        user: users.other,
        ip: '192.0.2.130',
      })),
      assertHttpError(400),
    )
    assert.equal(database.prepare('SELECT url FROM uploaded_images').first(), null)

    assert.deepEqual(await saveUploadedImage(createEvent(database, {
      method: 'POST',
      path: '/api/uploads/library',
      body: { url: ownerAssetUrl },
      ip: '192.0.2.131',
    })), { saved: true })
    assert.equal(
      database.prepare('SELECT url FROM uploaded_images WHERE owner_user_id = ?')
        .bind(users.owner.id)
        .first().url,
      ownerAssetUrl,
    )
  } finally {
    database.close()
  }
})
