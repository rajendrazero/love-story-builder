import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { getUnsupportedMusicProvider } from '../shared/music-embed.ts'

test('identifies music share providers without creating embed URLs', () => {
  assert.equal(getUnsupportedMusicProvider('https://open.spotify.com/track/123'), 'Spotify')
  assert.equal(getUnsupportedMusicProvider('https://music.youtube.com/watch?v=abcdefghijk'), 'YouTube Music')
  assert.equal(getUnsupportedMusicProvider('https://youtu.be/abcdefghijk'), 'YouTube Music')
  assert.equal(getUnsupportedMusicProvider('https://soundcloud.com/artist/track'), 'SoundCloud')
  assert.equal(getUnsupportedMusicProvider('https://soundcloud.com.evil.example/artist/track'), null)
  assert.equal(getUnsupportedMusicProvider('http://open.spotify.com/track/123'), null)
  assert.equal(getUnsupportedMusicProvider('https://cdn.example.com/song.mp3'), null)
  assert.equal(getUnsupportedMusicProvider('not a URL'), null)

  const providerModule = readFileSync(new URL('../shared/music-embed.ts', import.meta.url), 'utf8')
  assert.doesNotMatch(providerModule, /embed|iframe/i)
})
