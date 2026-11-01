import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { stopStoryAudio, toggleStoryAudio } from '../app/composables/story/story-audio.ts'

test('direct audio starts after a user action and toggles to pause', async () => {
  const calls = []
  const audio = {
    play: async () => calls.push('play'),
    pause: () => calls.push('pause'),
  }
  const state = { playing: false, error: '' }

  await toggleStoryAudio(audio, state)
  assert.deepEqual(state, { playing: true, error: '' })
  await toggleStoryAudio(audio, state)

  assert.deepEqual(state, { playing: false, error: '' })
  assert.deepEqual(calls, ['play', 'pause'])
})

test('audio playback failures are exposed in player state', async () => {
  const state = { playing: false, error: '' }

  await toggleStoryAudio({
    play: async () => {
      throw new Error('autoplay blocked')
    },
    pause: () => {},
  }, state)

  assert.deepEqual(state, {
    playing: false,
    error: 'Lagu tidak dapat diputar. Periksa tautan audio langsungnya.',
  })
})

test('stopping the player pauses audio during source changes and cleanup', () => {
  let paused = false
  const state = { playing: true, error: '' }

  stopStoryAudio({ play: async () => {}, pause: () => { paused = true } }, state)

  assert.equal(paused, true)
  assert.equal(state.playing, false)
  assert.doesNotThrow(() => stopStoryAudio(null, state))
})

test('music UI preserves user-initiated playback and lifecycle cleanup', () => {
  const component = readFileSync(new URL('../app/components/story-experience/StoryMusicPlayer.vue', import.meta.url), 'utf8')

  assert.match(component, /@click="toggleMusic"/)
  assert.match(component, /<audio ref="audio" :src="activeMusicUrl" preload="none" loop \/>/)
  assert.match(component, /@click="embeddedMusicStarted = true"/)
  assert.match(component, /watch\(activeMusicUrl, \(\) => \{\s*stopStoryAudio\(audio\.value, state\)/)
  assert.match(component, /onBeforeUnmount\(\(\) => \{\s*stopStoryAudio\(audio\.value, state\)/)
})
