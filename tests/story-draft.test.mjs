import assert from 'node:assert/strict'
import { test } from 'node:test'
import { storyDraftSchema } from '../shared/schema/draft.ts'
import { STORY_SECTION_TYPES } from '../shared/story-sections.ts'

test('draft schema persists entrance style and supports the full dynamic wizard range', () => {
  const maximumStep = STORY_SECTION_TYPES.length + 2
  assert.equal(storyDraftSchema.safeParse({ entranceStyle: 'atlas', activeStep: maximumStep }).success, true)
  assert.equal(storyDraftSchema.safeParse({ entranceStyle: 'unknown' }).success, false)
  assert.equal(storyDraftSchema.safeParse({ activeStep: maximumStep + 1 }).success, false)
})
