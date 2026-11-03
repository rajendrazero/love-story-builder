import assert from 'node:assert/strict'
import { test } from 'node:test'
import { publishStorySchema, storyContentSchema, updateStorySchema } from '../shared/schema/story.ts'
import { storySlugPattern } from '../shared/story-slug.ts'
import { createDefaultSectionConfig } from '../shared/story-sections.ts'

const story = {
  title: 'A story about us',
  coupleNames: 'Alya & Bima',
  date: 'Since 2022',
  heroImage: 'https://example.com/hero.jpg',
  greetingImage: 'https://example.com/greeting.jpg',
  greetingVideoUrl: '',
  greetingText: 'A note for you',
  gallery: [{ url: 'https://example.com/gallery.jpg', caption: 'Our day' }],
  secondImage: 'https://example.com/second.jpg',
  detailTitle: 'The beginning',
  detailText: 'We met and started a life together.',
  storyPages: [{ title: 'First chapter', text: 'Our first memory.', image: 'https://example.com/page.jpg' }],
  finalImage: 'https://example.com/final.jpg',
  finalMessage: 'I would choose you again.',
  musicUrl: '',
}

test('accepts each template-specific set of copy and safe cursor presets', () => {
  const templateOptions = [
    {
      templateId: 'editorial-rose',
      templateDetails: { editorialRose: { dedication: 'A special edition', signature: 'With love' } },
      cursorPreset: 'heart',
    },
    {
      templateId: 'midnight-cinema',
      templateDetails: { midnightCinema: { openingQuote: 'A line from our film', credits: 'Starring us' } },
      cursorPreset: 'sparkle',
    },
    {
      templateId: 'botanical-journal',
      templateDetails: { botanicalJournal: { journalLabel: 'Field notes', fieldNote: 'Growing together' } },
      cursorPreset: 'flower',
    },
    {
      templateId: 'love-letter',
      templateDetails: { editorialRose: { dedication: 'For you, always', signature: 'With love' } },
      cursorPreset: 'heart',
    },
    {
      templateId: 'memory-atlas',
      cursorPreset: 'star',
    },
    {
      templateId: 'editorial-rose',
      cursorPreset: 'system',
    },
  ]

  for (const options of templateOptions) {
    assert.equal(storyContentSchema.safeParse({ ...story, ...options }).success, true)
  }
})

test('rejects arbitrary cursor values and oversized template copy', () => {
  assert.equal(storyContentSchema.safeParse({ ...story, cursorPreset: 'url(https://attacker.example)' }).success, false)
  assert.equal(storyContentSchema.safeParse({
    ...story,
    templateId: 'editorial-rose',
    templateDetails: { editorialRose: { dedication: 'x'.repeat(181) } },
  }).success, false)
})

test('continues to accept older published stories without optional template settings', () => {
  assert.equal(storyContentSchema.safeParse(story).success, true)
})

test('validates required content only for enabled sections', () => {
  const hero = createDefaultSectionConfig('hero', 0)
  const gallery = createDefaultSectionConfig('gallery', 1)
  const loveNotes = createDefaultSectionConfig('love-notes', 1)

  const missingGallery = storyContentSchema.safeParse({
    ...story,
    templateId: 'memory-atlas',
    sectionLayout: [hero, gallery],
    gallery: [],
  })

  test('accepts multiple love notes and future plans within the editor list limit', () => {
    const sections = [
      createDefaultSectionConfig('hero', 0),
      createDefaultSectionConfig('love-notes', 1),
      createDefaultSectionConfig('future-dreams', 2),
    ]
    const multipleItems = storyContentSchema.safeParse({
      ...story,
      sectionLayout: sections,
      sectionContent: {
        loveNotes: ['Catatan pertama', 'Catatan kedua', 'Catatan ketiga'],
        futureDreams: ['Rencana pertama', 'Rencana kedua', 'Rencana ketiga'],
      },
    })

    assert.equal(multipleItems.success, true)
    assert.equal(storyContentSchema.safeParse({
      ...story,
      sectionLayout: sections,
      sectionContent: {
        loveNotes: Array.from({ length: 13 }, (_, index) => `Catatan ${index + 1}`),
        futureDreams: ['Rencana bersama'],
      },
    }).success, false)
  })
  assert.equal(missingGallery.success, false)
  assert.ok(missingGallery.error.issues.some(issue => issue.path[0] === 'gallery'))

  const disabledGallery = storyContentSchema.safeParse({
    ...story,
    templateId: 'memory-atlas',
    sectionLayout: [hero, { ...gallery, enabled: false }],
    gallery: [],
  })
  assert.equal(disabledGallery.success, true)

  const missingLoveNotes = storyContentSchema.safeParse({
    ...story,
    templateId: 'memory-atlas',
    sectionLayout: [hero, loveNotes],
    sectionContent: { loveNotes: [] },
  })
  assert.equal(missingLoveNotes.success, false)
  assert.ok(missingLoveNotes.error.issues.some(issue =>
    issue.path[0] === 'sectionContent' && issue.path[1] === 'love-notes',
  ))
})

test('accepts registered entrance styles and rejects unknown styles', () => {
  assert.equal(storyContentSchema.safeParse({ ...story, entranceStyle: 'atlas' }).success, true)
  assert.equal(storyContentSchema.safeParse({ ...story, entranceStyle: 'unknown' }).success, false)
})

test('accepts short custom story links and normalizes their casing', () => {
  const parsed = publishStorySchema.safeParse({ ...story, customSlug: 'Our-Little-Story' })
  assert.equal(parsed.success, true)
  assert.equal(parsed.data.customSlug, 'our-little-story')
  assert.equal(updateStorySchema.safeParse({ ...story, customSlug: 'first-date' }).success, true)
  assert.equal(publishStorySchema.safeParse({ ...story, customSlug: '' }).data.customSlug, undefined)
})

test('rejects unsafe, reserved-shape, and overlong custom story links', () => {
  for (const customSlug of ['ab', '-start', 'end-', 'double--dash', 'has space', 'hello_world', 'x'.repeat(33), 'https://evil.example']) {
    assert.equal(publishStorySchema.safeParse({ ...story, customSlug }).success, false, customSlug)
  }
  assert.equal(storySlugPattern.test('aaaaaaaaaaaa'), true)
})
