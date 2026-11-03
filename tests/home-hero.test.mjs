import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const page = readFileSync(new URL('../app/pages/index.vue', import.meta.url), 'utf8')
const scene = readFileSync(new URL('../app/components/HomeHeroScene.vue', import.meta.url), 'utf8')

test('hero composition uses exactly two local photos and no bubble overlay', () => {
  assert.match(page, /import heroOne from '\.\.\/assets\/img\/hero1\.jpg'/)
  assert.match(page, /import heroTwo from '\.\.\/assets\/img\/hero2\.jpg'/)
  assert.equal((page.match(/<img :src="hero(?:One|Two)" alt="">/g) ?? []).length, 2)
  assert.equal((scene.match(/createPhotoCard\(\s+hero(?:One|Two),/g) ?? []).length, 2)
  assert.doesNotMatch(scene, /SphereGeometry|glassOrb|floatingBubbles/)
  assert.doesNotMatch(page, /hero-fallback-orb/)
})

test('home parallax uses direct scrub triggers and refreshes after the page mounts', () => {
  assert.match(page, /gsap\.registerPlugin\(ScrollTrigger\)/)
  assert.match(page, /motionMedia\.add\('\(prefers-reduced-motion: no-preference\)'/)
  assert.match(page, /trigger: featureSection,[\s\S]*?scrub: 0\.35/)
  assert.match(page, /trigger: ctaSection,[\s\S]*?scrub: 0\.35/)
  assert.match(page, /\.to\(heroGlows, \{ yPercent: 32, ease: 'none' \}, 0\)/)
  assert.match(page, /\.to\(heroCopy, \{ yPercent: -15/)
  assert.doesNotMatch(page, /trigger: heroSection/)
  assert.doesNotMatch(page, /const stackMotion = gsap\.matchMedia/)
  assert.match(page, /nextTick\(\(\) => ScrollTrigger\.refresh\(\)\)/)
})

test('story decorations vary by template and story section without entering layout flow', () => {
  const decorations = readFileSync(new URL('../app/components/story-experience/DecorativeLayer.vue', import.meta.url), 'utf8')
  const experience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')

  for (const templateId of ['editorial-rose', 'midnight-cinema', 'botanical-journal', 'love-letter', 'memory-atlas']) {
    assert.ok(decorations.includes(`templateId === '${templateId}'`) || (templateId === 'memory-atlas' && decorations.includes('v-else>')))
  }
  assert.match(decorations, /decorative-scene-\$\{scene\}/)
  assert.match(experience, /:template-id="story\.templateId \?\? 'editorial-rose'"/)
  assert.match(decorations, /\.decorative-layer\s*\{[^}]*position: absolute;[^}]*inset: 0;/s)
})

test('three.js scene loading waits until the browser is idle', () => {
  assert.match(scene, /import type \* as THREE from 'three'/)
  assert.match(scene, /await import\('three'\)/)
  assert.match(scene, /window\.requestIdleCallback\(loadScene, \{ timeout: 1200 \}\)/)
})

test('decorative art stays out of story layout and behind template content', () => {
  const decorations = readFileSync(new URL('../app/components/story-experience/DecorativeLayer.vue', import.meta.url), 'utf8')
  const experience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')

  assert.match(decorations, /\.decorative-layer\s*\{[^}]*position: absolute;[^}]*inset: 0;/s)
  assert.match(experience, /\.story-screen\s*\{[^}]*isolation: isolate;/s)
  assert.match(experience, /\.story-section-decorations\s*\{[^}]*z-index: 0;/s)
  assert.match(experience, /\.story-screen > :not\(\.story-section-decorations\)/)
})
