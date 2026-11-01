import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { useStoryGallery } from '../app/composables/story/useStoryGallery.ts'

test('gallery navigation scrolls by three quarters of its visible width', () => {
  const calls = []
  const track = {
    clientWidth: 800,
    scrollBy: options => calls.push(options),
  }
  const gallery = useStoryGallery(() => track)

  gallery.scroll(1)
  gallery.scroll(-1)

  assert.deepEqual(calls, [
    { left: 600, behavior: 'smooth' },
    { left: -600, behavior: 'smooth' },
  ])
})

test('gallery navigation safely ignores an unavailable track', () => {
  const gallery = useStoryGallery(() => null)

  assert.doesNotThrow(() => gallery.scroll(1))
})

test('story renderer delegates its gallery slot to the reusable gallery component', () => {
  const storyExperience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const galleryComponent = readFileSync(new URL('../app/components/story-experience/StoryGallery.vue', import.meta.url), 'utf8')

  assert.match(storyExperience, /<StoryGallery :photos="story\.gallery" :template-id="story\.templateId" \/>/)
  assert.match(storyExperience, /<template #gallery>/)
  assert.match(galleryComponent, /@keydown\.left\.prevent="scroll\(-1\)"/)
  assert.match(galleryComponent, /@keydown\.right\.prevent="scroll\(1\)"/)
  for (const templateId of [
    'editorial-rose',
    'midnight-cinema',
    'botanical-journal',
    'love-letter',
    'memory-atlas',
  ]) {
    assert.ok(galleryComponent.includes(`'${templateId}':`), `${templateId} gallery copy should be defined`)
    assert.ok(galleryComponent.includes(`template-${templateId}`), `${templateId} gallery styling should be defined`)
  }
})
