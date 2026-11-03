import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('story animation setup respects reduced motion and reverts its GSAP context', () => {
  const component = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')

  assert.match(component, /gsap\.registerPlugin\(ScrollTrigger\)/)
  assert.match(component, /motionMedia = gsap\.matchMedia\(root\)/)
  assert.match(component, /motionMedia\.add\('\(prefers-reduced-motion: no-preference\)'/)
  assert.match(component, /root\.querySelectorAll<HTMLElement>\('\[data-story-section\]'\)/)
  assert.match(component, /config\.animation\.entrance/)
  assert.match(component, /config\.animation\.scroll/)
  assert.match(component, /ScrollTrigger\.refresh\(\)/)
  assert.match(component, /onBeforeUnmount\(\(\) => \{\s*appCursorPreset\.value = 'system'\s*motionMedia\?\.revert\(\)/)
  assert.match(component, /@media \(prefers-reduced-motion: reduce\)/)
})

test('animation selectors still target sections extracted to child components', () => {
  const component = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const sections = readFileSync(new URL('../app/components/story-experience/StorySectionRenderer.vue', import.meta.url), 'utf8')

  assert.match(component, /orderedSections\.value\.forEach/)
  assert.match(sections, /data-story-section="greeting"/)
  assert.match(sections, /data-story-section="first-encounter"/)
  assert.match(sections, /data-story-section="finale"/)
})
