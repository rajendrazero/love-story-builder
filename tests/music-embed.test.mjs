import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getMusicEmbed } from '../shared/music-embed.ts'

test('creates Spotify embeds from standard and localized share links', () => {
  for (const [url, type] of [
    ['https://open.spotify.com/track/1234567890123456789012?si=share-token', 'track'],
    ['https://open.spotify.com/intl-id/album/1234567890123456789012', 'album'],
    ['https://open.spotify.com/intl-id/track/1vTcULJfuJ8KEpOEuJcKSV?si=426b19b31a0648e2', 'track'],
    ['https://open.spotify.com/playlist/1234567890123456789012', 'playlist'],
  ]) {
    const id = type === 'track' && url.includes('1vTcULJfuJ8KEpOEuJcKSV')
      ? '1vTcULJfuJ8KEpOEuJcKSV'
      : '1234567890123456789012'
    assert.deepEqual(
      getMusicEmbed(url),
      {
        provider: 'spotify',
        contentType: type,
        src: `https://open.spotify.com/embed/${type}/${id}`,
        title: `Pemutar Spotify ${type}`,
      },
    )
  }
})

test('creates privacy-enhanced YouTube Music embeds for songs and playlists', () => {
  for (const url of [
    'https://music.youtube.com/watch?v=abcdefghijk',
  ]) {
    assert.equal(
      getMusicEmbed(url)?.src,
      'https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0',
    )
  }
  assert.deepEqual(
    getMusicEmbed('https://music.youtube.com/playlist?list=PLabcdefghijk123456'),
    {
      provider: 'youtube-music',
      contentType: 'playlist',
      src: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLabcdefghijk123456',
      title: 'Pemutar playlist YouTube Music',
    },
  )
})
test('keeps unsupported providers and malformed share links out of the embed player', () => {
  assert.equal(getMusicEmbed('https://cdn.example.com/song.mp3'), null)
  assert.equal(getMusicEmbed('http://open.spotify.com/track/1234567890123456789012'), null)
  assert.equal(getMusicEmbed('https://open.spotify.com/track/invalid'), null)
  assert.equal(getMusicEmbed('https://attacker.example/watch?v=abcdefghijk'), null)
  assert.equal(getMusicEmbed('https://www.youtube.com/watch?v=abcdefghijk'), null)
  assert.equal(getMusicEmbed('https://music.youtube.com/playlist?list=bad'), null)
})
