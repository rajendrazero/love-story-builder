import { inject, type ComputedRef, type InjectionKey } from 'vue'

export type MusicPlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

export interface StoryMusicEngine {
  readonly hasTrack: ComputedRef<boolean>
  readonly status: ComputedRef<MusicPlaybackStatus>
  readonly volume: ComputedRef<number>
  readonly error: ComputedRef<string>
  toggle(): Promise<void>
  setVolume(value: number): void
}

export const storyMusicEngineKey: InjectionKey<StoryMusicEngine> = Symbol('story-music-engine')

export function useStoryMusicEngine(): StoryMusicEngine {
  const engine = inject(storyMusicEngineKey)
  if (!engine) throw new Error('MusicEngine must wrap its music controls.')
  return engine
}
