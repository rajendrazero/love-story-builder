<template>
  <aside class="floating-music-player" :class="{ 'floating-music-player-playing': engine.status.value === 'playing' }" aria-label="Pemutar musik cerita">
    <button
      type="button"
      class="floating-music-play"
      :disabled="!engine.hasTrack.value"
      :aria-label="engine.status.value === 'playing' ? 'Jeda musik cerita' : 'Putar musik cerita'"
      :aria-pressed="engine.status.value === 'playing'"
      @click="engine.toggle"
    >
      <AudioVisualizer :playing="engine.status.value === 'playing'" />
      <AppIcon :name="engine.status.value === 'playing' ? 'pause' : 'play'" :size="17" />
      <span>{{ engine.status.value === 'playing' ? 'Jeda' : 'Putar' }}</span>
    </button>
    <button
      type="button"
      class="floating-music-expand"
      :aria-expanded="expanded"
      aria-controls="story-music-controls"
      :aria-label="expanded ? 'Tutup pengaturan musik' : 'Buka pengaturan musik'"
      @click="expanded = !expanded"
    >
      <AppIcon :name="expanded ? 'close' : 'more-horizontal'" :size="19" />
    </button>
    <MusicControlPanel
      v-if="expanded"
      id="story-music-controls"
      class="floating-music-panel"
      :artist="artist"
      :error="engine.error.value"
      :has-track="engine.hasTrack.value"
      :status="engine.status.value"
      :title="title"
      :volume="engine.volume.value"
      @volume-change="engine.setVolume"
    />
  </aside>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useStoryMusicEngine } from '~/composables/story/music-engine'
import AudioVisualizer from './AudioVisualizer.vue'
import MusicControlPanel from './MusicControlPanel.vue'

defineProps<{
  artist?: string
  title?: string
}>()

const engine = useStoryMusicEngine()
const expanded = shallowRef(false)
</script>

<style scoped>
.floating-music-player {
  position: fixed;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid rgb(255 250 245 / 18%);
  border-radius: 999px;
  padding: 0.3rem;
  color: #fffaf5;
  background: rgb(35 29 37 / 90%);
  box-shadow: 0 0.7rem 2rem rgb(20 14 24 / 22%);
  backdrop-filter: blur(1rem);
}

.floating-music-play,
.floating-music-expand {
  display: inline-flex;
  min-width: 2.8rem;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 0;
  border-radius: 999px;
  color: inherit;
  background: transparent;
  font-size: 0.72rem;
  cursor: pointer;
}

.floating-music-play {
  padding-inline: 0.8rem;
}

.floating-music-player-playing .floating-music-play {
  color: #f1d9a8;
}

.floating-music-play:disabled {
  color: rgb(255 250 245 / 45%);
  cursor: not-allowed;
}

.floating-music-expand {
  width: 2.8rem;
  font-size: 1rem;
}

.floating-music-play:focus-visible,
.floating-music-expand:focus-visible {
  outline: 2px solid #f1d9a8;
  outline-offset: 2px;
}

.floating-music-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.6rem);
}

@media (max-width: 480px) {
  .floating-music-player {
    right: max(0.7rem, env(safe-area-inset-right));
    bottom: max(0.7rem, env(safe-area-inset-bottom));
  }
}
</style>
