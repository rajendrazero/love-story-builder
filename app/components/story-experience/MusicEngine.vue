<template>
  <audio
    ref="audio"
    class="music-engine-audio"
    :src="audioSource || undefined"
    preload="none"
    loop
    @loadstart="state.status = 'loading'"
    @canplay="onCanPlay"
    @play="state.status = 'playing'"
    @pause="onPause"
    @error="onAudioError"
  />
  <slot />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, reactive, useTemplateRef, watch } from 'vue'
import { getUnsupportedMusicProvider } from '#shared/music-embed'
import { storyMusicEngineKey, type MusicPlaybackStatus } from '~/composables/story/music-engine'

const props = defineProps<{
  source: string
}>()

const audio = useTemplateRef<HTMLAudioElement>('audio')
const state = reactive({
  status: 'idle' as MusicPlaybackStatus,
  volume: 0.8,
  error: '',
})
const unsupportedProvider = computed(() => getUnsupportedMusicProvider(props.source))
const audioSource = computed(() => unsupportedProvider.value ? '' : props.source.trim())
const hasTrack = computed(() => props.source.trim().length > 0)

watch(audioSource, (source) => {
  const player = audio.value
  if (!player) return

  player.pause()
  player.currentTime = 0
  if (source) player.src = source
  else player.removeAttribute('src')
  player.load()
  state.status = 'idle'
  state.error = ''
})

watch(() => state.volume, (volume) => {
  if (audio.value) audio.value.volume = volume
}, { immediate: true })

onMounted(() => {
  if (audio.value) audio.value.volume = state.volume
})

onBeforeUnmount(() => {
  const player = audio.value
  if (!player) return
  player.pause()
  player.removeAttribute('src')
  player.load()
})

function onCanPlay(): void {
  if (state.status === 'loading') state.status = 'paused'
}

function onPause(): void {
  if (state.status !== 'error' && hasTrack.value) state.status = 'paused'
}

function onAudioError(): void {
  if (!hasTrack.value || unsupportedProvider.value) return
  state.status = 'error'
  state.error = 'File audio tidak dapat dimuat. Periksa URL dan format file.'
}

async function toggle(): Promise<void> {
  const player = audio.value
  if (!player) return

  if (state.status === 'playing') {
    player.pause()
    state.status = 'paused'
    return
  }
  if (!hasTrack.value) {
    state.status = 'error'
    state.error = 'Musik belum ditambahkan ke cerita ini.'
    return
  }
  if (unsupportedProvider.value) {
    state.status = 'error'
    state.error = `Tautan ${unsupportedProvider.value} tidak didukung. Gunakan URL HTTPS file audio langsung.`
    return
  }

  state.error = ''
  state.status = 'loading'
  try {
    await player.play()
    state.status = 'playing'
  } catch {
    state.status = 'error'
    state.error = 'Browser tidak dapat memutar audio. Periksa URL audio langsung dan izin pemutarannya.'
  }
}

function setVolume(value: number): void {
  if (!Number.isFinite(value)) {
    state.status = 'error'
    state.error = 'Nilai volume tidak valid.'
    return
  }
  state.volume = Math.min(1, Math.max(0, value))
}

provide(storyMusicEngineKey, {
  hasTrack,
  status: computed(() => state.status),
  volume: computed(() => state.volume),
  error: computed(() => state.error),
  toggle,
  setVolume,
})
</script>

<style scoped>
.music-engine-audio {
  display: none;
}
</style>
