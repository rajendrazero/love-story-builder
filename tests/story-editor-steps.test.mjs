import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createStoryEditorSteps } from '../shared/story-editor-steps.ts'
import { STORY_SECTION_TYPES, createDefaultSectionConfig } from '../shared/story-sections.ts'

test('editor steps follow enabled section order and keep the cover in the opening step', () => {
  const sections = [
    createDefaultSectionConfig('hero', 0),
    createDefaultSectionConfig('gallery', 2),
    createDefaultSectionConfig('love-notes', 1),
    { ...createDefaultSectionConfig('music', 3), enabled: false },
  ]

  assert.deepEqual(
    createStoryEditorSteps(sections).map(step => step.id),
    ['theme', 'cover', 'sections', 'section:love-notes', 'section:gallery', 'settings'],
  )
})

test('editor step count changes with active sections without dropping fixed steps', () => {
  const stepsWithoutExtraSection = createStoryEditorSteps([
    createDefaultSectionConfig('hero', 0),
    createDefaultSectionConfig('gallery', 1),
  ])
  const stepsWithExtraSection = createStoryEditorSteps([
    createDefaultSectionConfig('hero', 0),
    createDefaultSectionConfig('gallery', 1),
    createDefaultSectionConfig('countdown', 2),
  ])

  assert.equal(stepsWithoutExtraSection.length, 5)
  assert.equal(stepsWithExtraSection.length, 6)
  assert.equal(stepsWithExtraSection[0]?.id, 'theme')
  assert.equal(stepsWithExtraSection.at(-1)?.id, 'settings')
})

test('every configured section has an input step or the dedicated cover step', () => {
  const steps = createStoryEditorSteps(
    STORY_SECTION_TYPES.map((type, order) => createDefaultSectionConfig(type, order)),
  )

  assert.ok(steps.some(step => step.id === 'cover'))
  for (const type of STORY_SECTION_TYPES.filter(type => type !== 'hero')) {
    assert.ok(steps.some(step => step.id === `section:${type}`), `${type} needs an editor step`)
  }
})
