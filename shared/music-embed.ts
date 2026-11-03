export type UnsupportedMusicProvider = 'Spotify' | 'YouTube Music' | 'SoundCloud'

export function getUnsupportedMusicProvider(value: string): UnsupportedMusicProvider | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }

  if (url.protocol !== 'https:') return null

  if (url.hostname === 'open.spotify.com') return 'Spotify'
  if (url.hostname === 'music.youtube.com' || url.hostname === 'youtube.com'
    || url.hostname === 'www.youtube.com' || url.hostname === 'youtu.be') {
    return 'YouTube Music'
  }
  if (url.hostname === 'soundcloud.com' || url.hostname === 'www.soundcloud.com'
    || url.hostname === 'm.soundcloud.com') {
    return 'SoundCloud'
  }

  return null
}
