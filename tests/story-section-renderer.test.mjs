import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('story experience delegates greeting, detail, and finale sections', () => {
  const storyExperience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const renderer = readFileSync(new URL('../app/components/story-experience/StorySectionRenderer.vue', import.meta.url), 'utf8')

  for (const section of ['greeting', 'detail', 'finale']) {
    assert.match(storyExperience, new RegExp(`<StorySectionRenderer :story="story" section="${section}" \\/>`))
    assert.ok(renderer.includes(`class="story-screen story-${section}"`))
  }

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
