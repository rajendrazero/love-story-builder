import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { storyTemplates } from '../shared/story-templates.ts'

const engine = readFileSync(new URL('../app/components/story-experience/MusicEngine.vue', import.meta.url), 'utf8')
const player = readFileSync(new URL('../app/components/story-experience/FloatingMusicPlayer.vue', import.meta.url), 'utf8')
const entrance = readFileSync(new URL('../app/components/story-experience/EntranceCover.vue', import.meta.url), 'utf8')
const experience = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
const decorations = readFileSync(new URL('../app/components/story-experience/DecorativeLayer.vue', import.meta.url), 'utf8')

test('the music engine owns one direct audio element and no external embeds', () => {
  assert.equal((engine.match(/<audio\b/g) ?? []).length, 1)
  assert.match(engine, /:src="audioSource \|\| undefined"/)
  assert.match(engine, /preload="none"/)
  assert.doesNotMatch(engine, /<iframe\b|embedUrl|embedSrc/)
})

test('the engine handles play, pause, volume, source changes, and failures', () => {
  assert.match(engine, /await player\.play\(\)/)
  assert.match(engine, /player\.pause\(\)/)
  assert.match(engine, /player\.currentTime = 0/)
  assert.match(engine, /player\.removeAttribute\('src'\)/)
  assert.match(engine, /player\.load\(\)/)
  assert.match(engine, /onBeforeUnmount\(\(\) => \{\s*const player = audio\.value[\s\S]*?player\.pause\(\)[\s\S]*?player\.removeAttribute\('src'\)/)
  assert.match(engine, /Math\.min\(1, Math\.max\(0, value\)\)/)
  assert.match(engine, /state\.status = 'error'/)
  assert.match(engine, /state\.error = 'Browser tidak dapat memutar audio/)
})

test('the floating controls expose playback and volume accessibly', () => {
  assert.match(player, /aria-label="Pemutar musik cerita"/)
  assert.match(player, /:aria-label="engine\.status\.value === 'playing' \? 'Jeda musik cerita' : 'Putar musik cerita'"/)
  assert.match(player, /@click="engine\.toggle"/)
  assert.match(player, /@volume-change="engine\.setVolume"/)
})

test('the entrance starts playback only when music exists and only from the open action', () => {
  assert.match(entrance, /@click="openStory"/)
  assert.match(entrance, /if \(music\.hasTrack\.value\) void music\.toggle\(\)/)
  assert.doesNotMatch(entrance, /onMounted\([^)]*toggle/s)
})

test('every template has an entrance action and an implemented visual style', () => {
  const styles = new Set(['editorial', 'cinema', 'botanical', 'letter', 'atlas'])
  for (const template of storyTemplates) {
    assert.ok(styles.has(template.entrance.style), `${template.id} needs a supported entrance style`)
    assert.ok(template.entrance.actionLabel, `${template.id} needs an entrance action label`)
    assert.match(entrance, new RegExp(`\\b${template.entrance.style}:`))
  }
})

test('story content stays inert until the entrance finishes and then receives focus', () => {
  assert.match(experience, /:inert="!experienceReady"/)
  assert.match(experience, /:aria-hidden="!experienceReady"/)
  assert.match(experience, /@after-leave="finishEntrance"/)
  assert.match(experience, /experience\.value\?\.focus\(\)/)
})

test('decorative motion is hidden from assistive technology and disabled for reduced motion', () => {
  assert.match(decorations, /aria-hidden="true"/)
  assert.match(decorations, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(decorations, /animation: none !important/)
})

test('studio exposes direct URLs and protected upload instead of external music embeds', () => {
  const editor = readFileSync(new URL('../app/pages/studio.vue', import.meta.url), 'utf8')
  const field = readFileSync(new URL('../app/components/AudioField.vue', import.meta.url), 'utf8')

  assert.match(editor, /<AudioField v-model="draft\.musicUrl"/)
  assert.match(editor, /Spotify, YouTube Music, dan SoundCloud tidak dapat diputar langsung/)
  assert.match(field, /rightsConfirmed/)
  assert.match(field, /uploadAudioToCloudinary/)
  assert.match(field, /role="alert"/)
  assert.doesNotMatch(editor, /Tautan berbagi Spotify/)
})
