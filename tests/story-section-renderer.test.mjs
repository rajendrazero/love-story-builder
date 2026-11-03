import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('story experience renders the ordered section configuration through a typed host', () => {
  const storyExperience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const host = readFileSync(new URL('../app/components/story-experience/StorySectionHost.vue', import.meta.url), 'utf8')
  const renderer = readFileSync(new URL('../app/components/story-experience/StorySectionRenderer.vue', import.meta.url), 'utf8')

  assert.match(storyExperience, /v-for="section in orderedSections"/)
  assert.match(storyExperience, /:section="section"/)
  assert.match(storyExperience, /sortStorySections/)
  assert.match(host, /satisfies Record<StorySectionType, Component>/)
  assert.match(host, /'moments-in-motion': StoryMediaSection/)
  assert.match(host, /music: StoryMediaSection/)
  assert.match(host, /timeline: StoryJourneySection/)
  assert.match(host, /'love-notes': StoryDetailsSection/)
  assert.match(host, /'memory-capsule': StoryMemoryCapsuleSection/)

  assert.match(renderer, /sectionType === 'greeting'/)
  assert.match(renderer, /sectionType === 'first-encounter'/)
  assert.ok(renderer.includes('class="story-screen story-greeting"'))
  assert.ok(renderer.includes('class="story-screen story-detail"'))
  assert.ok(renderer.includes('class="story-screen story-finale"'))
  assert.match(renderer, /story\.greetingText/)
  assert.match(renderer, /story\.greetingVideoUrl/)
  assert.match(renderer, /story\.secondImage/)
  assert.match(renderer, /story\.detailTitle/)
  assert.match(renderer, /story\.finalImage/)
  assert.match(renderer, /story\.finalMessage/)
  assert.match(renderer, /story\.templateDetails\?\.midnightCinema\?\.credits/)
  assert.match(renderer, /story\.templateDetails\?\.editorialRose\?\.signature/)
})

test('section copy and styling cover every registered public template', () => {
  const renderer = readFileSync(new URL('../app/components/story-experience/StorySectionRenderer.vue', import.meta.url), 'utf8')

  for (const templateId of [
    'editorial-rose',
    'midnight-cinema',
    'botanical-journal',
    'love-letter',
    'memory-atlas',
  ]) {
    assert.ok(renderer.includes(`'${templateId}':`), `${templateId} section copy should be defined`)
    assert.ok(renderer.includes(`template-${templateId}`), `${templateId} section styling should be defined`)
  }
})
