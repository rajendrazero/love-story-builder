import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  STORY_SECTION_TYPES,
  createDefaultSectionConfig,
  sortStorySections,
  storySectionLayoutSchema,
  storySectionVariants,
  validateStorySectionContent,
} from '../shared/story-sections.ts'
import { createDefaultSectionLayout, storyTemplates } from '../shared/story-templates.ts'

test('every template starts with a distinct ordered composition of registered sections', () => {
  for (const template of storyTemplates) {
    const layout = createDefaultSectionLayout(template.id)
    assert.ok(layout.length >= 6)
    assert.equal(new Set(layout.map(section => section.type)).size, layout.length)
    assert.equal(layout.every(section => section.enabled), true)
    assert.equal(storySectionLayoutSchema.safeParse(layout).success, true)
  }

  assert.notDeepEqual(
    createDefaultSectionLayout('editorial-rose').map(section => section.type),
    createDefaultSectionLayout('midnight-cinema').map(section => section.type),
  )
})

test('section variants, unique IDs, and one instance per section type are validated', () => {
  const section = createDefaultSectionConfig('gallery', 0, 'film-strip')
  assert.equal(storySectionLayoutSchema.safeParse([section]).success, true)
  assert.equal(storySectionLayoutSchema.safeParse([{ ...section, variant: 'unknown-variant' }]).success, false)
  assert.equal(storySectionLayoutSchema.safeParse([section, { ...section, id: 'another-gallery' }]).success, false)
  assert.equal(storySectionLayoutSchema.safeParse([section, { ...section, id: 'gallery-2', type: 'hero' }]).success, false)
  assert.equal(STORY_SECTION_TYPES.length, Object.keys(storySectionVariants).length)
})

test('section ordering excludes disabled sections without mutating saved configuration', () => {
  const sections = [
    createDefaultSectionConfig('gallery', 2),
    { ...createDefaultSectionConfig('hero', 0), enabled: false },
    createDefaultSectionConfig('greeting', 1),
  ]
  const ordered = sortStorySections(sections)
  assert.deepEqual(ordered.map(section => section.type), ['greeting', 'gallery'])
  assert.equal(sections[0].order, 2)
})

test('optional content is required only when its matching section is active', () => {
  const inactiveSections = [createDefaultSectionConfig('memory-capsule', 0)]
    .map(section => ({ ...section, enabled: false }))
  assert.deepEqual(validateStorySectionContent(inactiveSections, undefined, {
    greetingVideoUrl: '',
    musicUrl: '',
  }), [])

  const activeSections = [
    createDefaultSectionConfig('moments-in-motion', 0),
    createDefaultSectionConfig('music', 1),
    createDefaultSectionConfig('love-notes', 2),
    createDefaultSectionConfig('distance-map', 3),
    createDefaultSectionConfig('future-dreams', 4),
    createDefaultSectionConfig('countdown', 5),
    createDefaultSectionConfig('memory-capsule', 6),
  ]
  assert.equal(validateStorySectionContent(activeSections, undefined, {
    greetingVideoUrl: '',
    musicUrl: '',
  }).length, activeSections.length)
})
