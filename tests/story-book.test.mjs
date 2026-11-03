import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  getStoryPageTurn,
  getStoryPageTurnDuration,
} from '../app/composables/story/story-book.ts'

test('book navigation advances and returns one page at a time', () => {
  const pages = ['first', 'second', 'third']

  assert.deepEqual(getStoryPageTurn(pages, 0, 'next'), {
    nextIndex: 1,
    page: 'first',
  })
  assert.deepEqual(getStoryPageTurn(pages, 2, 'previous'), {
    nextIndex: 1,
    page: 'second',
  })
})

test('book navigation rejects page turns beyond either boundary', () => {
  const pages = ['first', 'second']

  assert.equal(getStoryPageTurn(pages, 0, 'previous'), null)
  assert.equal(getStoryPageTurn(pages, 1, 'next'), null)
  assert.equal(getStoryPageTurn([], 0, 'next'), null)
})

test('reduced motion uses a shorter page-turn completion delay', () => {
  assert.equal(getStoryPageTurnDuration(false), 820)
  assert.equal(getStoryPageTurnDuration(true), 50)
})

test('book component preserves template copy, interaction, and cleanup wiring', () => {
  const storyExperience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const sectionHost = readFileSync(new URL('../app/components/story-experience/StorySectionHost.vue', import.meta.url), 'utf8')
  const component = readFileSync(new URL('../app/components/story-experience/StoryBookInteraction.vue', import.meta.url), 'utf8')

  assert.match(storyExperience, /<StorySectionHost/)
  assert.match(sectionHost, /book: StoryBookInteraction/)
  assert.match(component, /data-story-section="book"/)
  assert.match(component, /@click="turnPage\('next'\)"/)
  assert.match(component, /@click="turnPage\('previous'\)"/)
  assert.match(component, /@click="toggleBook"/)
  assert.match(component, /prefers-reduced-motion: reduce/)
  assert.match(component, /onBeforeUnmount\(\(\) => \{\s*if \(turnTimer\) clearTimeout\(turnTimer\)\s*if \(closeCoverFrame !== undefined\) cancelAnimationFrame\(closeCoverFrame\)/)

  for (const templateId of [
    'editorial-rose',
    'midnight-cinema',
    'botanical-journal',
    'love-letter',
    'memory-atlas',
  ]) {
    assert.ok(component.includes(`'${templateId}':`), `${templateId} book copy should be defined`)
    assert.ok(component.includes(`story-book.template-${templateId}`), `${templateId} book styling should be defined`)
  }
})
