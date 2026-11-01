import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { DatabaseSync } from 'node:sqlite'

const migrationPaths = [
  'migrations/0001_create_stories.sql',
  'migrations/0002_create_story_drafts.sql',
  'migrations/0003_add_account_ownership.sql',
  'migrations/0004_add_story_visibility.sql',
  'migrations/0005_create_api_rate_limits.sql',
  'migrations/0006_normalize_story_content.sql',
  'migrations/0007_cascade_story_content.sql',
  'migrations/0008_create_better_auth_tables.sql',
  'migrations/0009_seed_existing_user_roles.sql',
  'migrations/0010_add_draft_custom_slug.sql',
]

function legacyStory(templateId) {
  return {
    templateId,
    cursorPreset: 'sparkle',
    templateDetails: {
      editorialRose: { dedication: 'Edisi kenangan', signature: 'Dengan cinta' },
      midnightCinema: { openingQuote: 'Satu adegan lagi', credits: 'Dibintangi kita' },
      botanicalJournal: { journalLabel: 'Catatan no. 01', fieldNote: 'Tumbuh bersama' },
    },
    title: `Cerita ${templateId}`,
    coupleNames: 'Nara & Arka',
    date: '12 Juni 2021',
    heroImage: 'https://example.com/hero.jpg',
    greetingImage: 'https://example.com/greeting.jpg',
    greetingVideoUrl: '',
    greetingText: 'Untukmu',
    gallery: [
      { url: 'https://example.com/gallery-1.jpg', caption: 'Foto satu' },
      { url: 'https://example.com/gallery-2.jpg', caption: 'Foto dua' },
    ],
    secondImage: 'https://example.com/second.jpg',
    detailTitle: 'Hari pertama',
    detailText: 'Kisah kami bermula.',
    storyPages: [
      { title: 'Bab satu', text: 'Satu.', image: 'https://example.com/chapter-1.jpg' },
      { title: 'Bab dua', text: 'Dua.', image: 'https://example.com/chapter-2.jpg' },
    ],
    finalImage: 'https://example.com/final.jpg',
    finalMessage: 'Selalu memilihmu.',
    musicUrl: '',
  }
}

test('normalizes legacy stories and drafts without losing content or ownership', () => {
  const database = new DatabaseSync(':memory:')
  database.exec('PRAGMA foreign_keys = ON')

  for (const migrationPath of migrationPaths.slice(0, 5)) {
    database.exec(readFileSync(migrationPath, 'utf8'))
  }

  const insertStory = database.prepare(
    `INSERT INTO stories
     (id, slug, title, payload_json, password_salt, password_hash, published_at, created_at, owner_user_id, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const storyIds = [
    ['story-editorial', 'aaaaaaaaaaaa', 'editorial-rose'],
    ['story-cinema', 'bbbbbbbbbbbb', 'midnight-cinema'],
    ['story-botanical', 'cccccccccccc', 'botanical-journal'],
  ]
  for (const [id, slug, templateId] of storyIds) {
    const story = legacyStory(templateId)
    insertStory.run(
      id,
      slug,
      story.title,
      JSON.stringify(story),
      'salt',
      'hash',
      '2026-01-01T00:00:00.000Z',
      '2025-01-01T00:00:00.000Z',
      'user-1',
      1,
    )
  }

  const draftId = 'd'.repeat(32)
  const draft = {
    ...legacyStory('botanical-journal'),
    activeStep: 4,
    editingSlug: 'cccccccccccc',
  }
  database.prepare(
    `INSERT INTO story_drafts
     (id, key_hash, payload_json, published_slug, created_at, updated_at, owner_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(draftId, 'key-hash', JSON.stringify(draft), 'cccccccccccc', '2026-01-01', '2026-01-02', 'user-1')

  for (const migrationPath of migrationPaths.slice(5, 8)) {
    database.exec(readFileSync(migrationPath, 'utf8'))
  }
  database.prepare(
    `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run('existing-user', 'Existing', 'existing@example.com', 1, 1, 1)
  database.exec(readFileSync(migrationPaths[8], 'utf8'))
  database.exec(readFileSync(migrationPaths[9], 'utf8'))
  database.exec(readFileSync(migrationPaths[7], 'utf8'))
  database.exec(readFileSync(migrationPaths[8], 'utf8'))

  const storyContent = database.prepare(
    'SELECT template_id, cursor_preset, title, couple_names, date_label FROM story_content WHERE id = ?',
  ).get('story-cinema')
  assert.deepEqual({ ...storyContent }, {
    template_id: 'midnight-cinema',
    cursor_preset: 'sparkle',
    title: 'Cerita midnight-cinema',
    couple_names: 'Nara & Arka',
    date_label: '12 Juni 2021',
  })

  assert.equal(
    database.prepare('SELECT COUNT(*) AS count FROM story_gallery_items WHERE content_id = ?').get('story-cinema').count,
    2,
  )
  assert.equal(
    database.prepare('SELECT COUNT(*) AS count FROM story_chapters WHERE content_id = ?').get('story-cinema').count,
    2,
  )
  assert.equal(
    database.prepare('SELECT opening_quote FROM story_template_cinema WHERE content_id = ?').get('story-cinema').opening_quote,
    'Satu adegan lagi',
  )
  assert.equal(
    database.prepare('SELECT dedication FROM story_template_editorial WHERE content_id = ?').get('story-editorial').dedication,
    'Edisi kenangan',
  )
  assert.equal(
    database.prepare('SELECT journal_label FROM story_template_botanical WHERE content_id = ?').get('story-botanical').journal_label,
    'Catatan no. 01',
  )

  const published = database.prepare(
    'SELECT slug, password_hash, owner_user_id, is_active FROM stories WHERE id = ?',
  ).get('story-cinema')
  assert.deepEqual({ ...published }, {
    slug: 'bbbbbbbbbbbb',
    password_hash: 'hash',
    owner_user_id: 'user-1',
    is_active: 1,
  })
  const migratedDraft = database.prepare(
    'SELECT key_hash, owner_user_id, published_slug, active_step, editing_slug FROM story_drafts WHERE id = ?',
  ).get(draftId)
  assert.deepEqual({ ...migratedDraft }, {
    key_hash: 'key-hash',
    owner_user_id: 'user-1',
    published_slug: 'cccccccccccc',
    active_step: 4,
    editing_slug: 'cccccccccccc',
  })
  assert.ok(database.prepare("PRAGMA table_info('story_drafts')").all().some(column => column.name === 'custom_slug'))

  for (const table of ['stories', 'story_drafts']) {
    const columns = database.prepare(`PRAGMA table_info('${table}')`).all().map(row => row.name)
    assert.equal(columns.includes('payload_json'), false)
  }
  assert.equal(database.prepare("PRAGMA table_info('stories')").all().some(row => row.name === 'title'), false)
  assert.deepEqual(database.prepare('PRAGMA foreign_key_check').all(), [])

  for (const table of ['user', 'session', 'account', 'verification', 'rateLimit']) {
    assert.ok(
      database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(table),
      `${table} should be created by the auth migration`,
    )
  }
  assert.equal(
    database.prepare("PRAGMA table_info('user_roles')").all().find(column => column.name === 'role').dflt_value,
    "'user'",
  )
  assert.equal(database.prepare('SELECT role FROM user_roles WHERE user_id = ?').get('existing-user').role, 'user')
  database.prepare('INSERT INTO story_content (id) VALUES (?)').run('duplicate-slug-content')
  assert.throws(() => database.prepare(
    `INSERT INTO stories (id, slug, content_id, published_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run('duplicate-slug-story', 'bbbbbbbbbbbb', 'duplicate-slug-content', '2026-01-03', '2026-01-03'))
  assert.equal(database.prepare('SELECT id FROM stories WHERE slug = ?').all('bbbbbbbbbbbb').length, 1)
  database.prepare('DELETE FROM story_content WHERE id = ?').run('duplicate-slug-content')
  database.prepare(
    `INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run('admin-user', 'Admin', 'admin@example.com', 1, 1, 1)
  database.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run('admin-user', 'admin')
  assert.equal(database.prepare('SELECT role FROM user_roles WHERE user_id = ?').get('admin-user').role, 'admin')

  database.prepare('DELETE FROM stories WHERE id = ?').run('story-cinema')
  assert.equal(database.prepare('SELECT id FROM story_content WHERE id = ?').get('story-cinema'), undefined)
  database.prepare('DELETE FROM story_drafts WHERE id = ?').run(draftId)
  assert.equal(database.prepare('SELECT id FROM story_content WHERE id = ?').get(draftId), undefined)

  database.close()
})
