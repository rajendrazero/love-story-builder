<template>
  <div class="music-control-panel">
    <div class="music-control-track">
      <p class="music-control-title">{{ title || 'Soundtrack cerita' }}</p>
      <p v-if="artist" class="music-control-artist">{{ artist }}</p>
    </div>
    <label class="music-volume-control">
      <span>Volume</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        :value="volume"
        aria-label="Volume musik cerita"
        @input="updateVolume"
      >
    </label>
    <p v-if="status === 'loading'" class="music-control-status" role="status">Memuat musik…</p>
    <p v-if="error" class="music-control-error" role="alert" aria-atomic="true">
      <strong>Musik cerita · </strong>{{ error }}
    </p>
    <p v-else-if="!hasTrack" class="music-control-status">Musik belum ditambahkan.</p>
  </div>
</template>

<script setup lang="ts">
import type { MusicPlaybackStatus } from '~/composables/story/music-engine'

defineProps<{
  artist?: string
  error: string
  hasTrack: boolean
  status: MusicPlaybackStatus
  title?: string
  volume: number
}>()
const emit = defineEmits<{
  volumeChange: [value: number]
}>()

function updateVolume(event: Event): void {
  const input = event.currentTarget
  if (!(input instanceof HTMLInputElement)) return
  emit('volumeChange', input.valueAsNumber)
}
</script>

<style scoped>
.music-control-panel {
  display: grid;
  min-width: min(18rem, calc(100vw - 2rem));
  gap: 0.85rem;
  border: 1px solid rgb(255 250 245 / 16%);
  border-radius: 1rem;
  padding: 1rem;
  color: #fffaf5;
  background: rgb(35 29 37 / 94%);
  box-shadow: 0 1rem 2.5rem rgb(20 14 24 / 24%);
  backdrop-filter: blur(1rem);
}

.music-control-track p {
  margin: 0;
}

.music-control-title {
  font-family: var(--font-family-display);
  font-size: 1.15rem;
}

.music-control-artist {
  margin-top: 0.2rem !important;
  color: rgb(255 250 245 / 65%);
  font-size: 0.78rem;
}

.music-volume-control {
  display: grid;
  gap: 0.4rem;
  font-size: 0.72rem;
}

.music-volume-control input {
  width: 100%;
  accent-color: #e8c886;
}

.music-control-status,
.music-control-error {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.5;
}

.music-control-error {
  border: 1px solid rgb(255 209 201 / 35%);
  border-radius: 0.7rem;
  padding: 0.65rem 0.75rem;
  color: #ffd1c9;
  background: rgb(185 75 63 / 24%);
}
</style>
