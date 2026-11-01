export interface StoryAudioState {
  playing: boolean
  error: string
}

export type StoryAudioElement = Pick<HTMLAudioElement, 'pause' | 'play'>

export async function toggleStoryAudio(
  audio: StoryAudioElement | null,
  state: StoryAudioState,
): Promise<void> {
  if (!audio) return

  if (state.playing) {
    audio.pause()
    state.playing = false
    state.error = ''
    return
  }

  try {
    await audio.play()
    state.playing = true
    state.error = ''
  } catch {
    state.playing = false
    state.error = 'Lagu tidak dapat diputar. Periksa tautan audio langsungnya.'
  }
}

export function stopStoryAudio(audio: StoryAudioElement | null, state: StoryAudioState): void {
  audio?.pause()
  state.playing = false
}
