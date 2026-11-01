export interface MusicEmbed {
  provider: 'spotify' | 'youtube-music'
  contentType: 'track' | 'album' | 'playlist' | 'episode' | 'show' | 'video'
  src: string
  title: string
}

const spotifyTypes = new Set(['track', 'album', 'playlist', 'episode', 'show'])
const youtubeMusicPlaylistPattern = /^[A-Za-z0-9_-]{10,128}$/

export function getMusicEmbed(value: string): MusicEmbed | null {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null

  if (url.hostname === 'open.spotify.com') {
    const path = url.pathname.split('/').filter(Boolean)
    if (path[0]?.startsWith('intl-')) path.shift()
    const [type, id] = path
    if (type && spotifyTypes.has(type) && id && /^[A-Za-z0-9]{22}$/.test(id)) {
      return {
        provider: 'spotify',
        contentType: type as MusicEmbed['contentType'],
        src: `https://open.spotify.com/embed/${type}/${id}`,
        title: `Pemutar Spotify ${type}`,
      }
    }
    return null
  }

  if (url.hostname !== 'music.youtube.com') return null
  if (url.pathname === '/playlist') {
    const playlistId = url.searchParams.get('list') ?? ''
    if (!youtubeMusicPlaylistPattern.test(playlistId)) return null
    return {
      provider: 'youtube-music',
      contentType: 'playlist',
      src: `https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlistId)}`,
      title: 'Pemutar playlist YouTube Music',
    }
  }

  const videoId = url.pathname === '/watch' ? url.searchParams.get('v') ?? '' : ''
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null
  return {
    provider: 'youtube-music',
    contentType: 'video',
    src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`,
    title: 'Pemutar YouTube Music',
  }
}
