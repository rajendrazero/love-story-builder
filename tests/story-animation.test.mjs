import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('story animation setup respects reduced motion and reverts its GSAP context', () => {
  const component = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')

  assert.match(component, /gsap\.registerPlugin\(ScrollTrigger\)/)
  assert.match(component, /motionMedia = gsap\.matchMedia\(root\)/)
  assert.match(component, /motionMedia\.add\('\(prefers-reduced-motion: no-preference\)'/)
  assert.match(component, /root\.querySelectorAll<HTMLElement>\('\.story-screen'\)/)
  assert.match(component, /ScrollTrigger\.refresh\(\)/)
  assert.match(component, /onBeforeUnmount\(\(\) => \{\s*appCursorPreset\.value = 'system'\s*motionMedia\?\.revert\(\)/)
  assert.match(component, /@media \(prefers-reduced-motion: reduce\)/)
})

test('animation selectors still target sections extracted to child components', () => {
  const component = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const sections = readFileSync(new URL('../app/components/story-experience/StorySectionRenderer.vue', import.meta.url), 'utf8')

  for (const section of ['story-greeting', 'story-detail', 'story-finale']) {
    assert.ok(component.includes(`'${section}':`), `${section} should retain its reveal selector`)
    assert.ok(sections.includes(`class="story-screen ${section}"`), `${section} should retain its section class`)
  }
})
