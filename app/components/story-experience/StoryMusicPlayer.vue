<template>
  <template v-if="activeMusicUrl && !musicEmbed">
    <button
      type="button"
      class="music-button"
      :aria-pressed="state.playing"
      @click="toggleMusic"
    >
      {{ state.playing ? 'Jeda lagu Ⅱ' : 'Putar lagu ♫' }}
    </button>
    <audio ref="audio" :src="activeMusicUrl" preload="none" loop />
  </template>
  <template v-else-if="musicEmbed">
    <button
      v-if="!embeddedMusicStarted"
      type="button"
      class="music-button"
      @click="embeddedMusicStarted = true"
    >
      Putar lagu penuh ♫
    </button>
    <p v-if="!embeddedMusicStarted" class="music-data-hint">
      Pemutar hanya dimuat setelah dipilih agar hemat data.
    </p>
    <div
      v-if="embeddedMusicStarted"
      class="music-embed"
      :class="[`music-embed-${musicEmbed.provider}`, `music-embed-${musicEmbed.contentType}`]"
    >
      <iframe
        :src="embeddedMusicSrc"
        :title="musicEmbed.title"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="eager"
        referrerpolicy="strict-origin-when-cross-origin"
      />
      <a
        v-if="musicEmbed.provider === 'spotify' || musicEmbed.provider === 'soundcloud'"
        class="music-embed-link"
        :href="activeMusicUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ musicEmbed.provider === 'spotify' ? 'Buka lagu di Spotify ↗' : 'Buka lagu di SoundCloud ↗' }}
      </a>
    </div>
  </template>
  <p v-if="state.error" class="music-error" role="status">{{ state.error }}</p>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { getMusicEmbed } from '#shared/music-embed'
import { stopStoryAudio, toggleStoryAudio } from '~/composables/story/story-audio'

const props = withDefaults(defineProps<{
  musicUrl: string
  demo?: boolean
  previewMusicUrl?: string
}>(), {
  demo: false,
  previewMusicUrl: '',
})

const audio = useTemplateRef<HTMLAudioElement>('audio')
const state = reactive({ playing: false, error: '' })
const embeddedMusicStarted = ref(false)
const activeMusicUrl = computed(() => props.demo ? props.previewMusicUrl.trim() : props.musicUrl)
const musicEmbed = computed(() => getMusicEmbed(activeMusicUrl.value))
const embeddedMusicSrc = computed(() => {
  if (!musicEmbed.value) return ''
  const url = new URL(musicEmbed.value.src)
  if (musicEmbed.value.provider !== 'soundcloud') {
    url.searchParams.set('autoplay', '1')
  }
  return url.toString()
})

watch(activeMusicUrl, () => {
  stopStoryAudio(audio.value, state)
  state.error = ''
  embeddedMusicStarted.value = false
})

async function toggleMusic(): Promise<void> {
  await toggleStoryAudio(audio.value, state)
}

onBeforeUnmount(() => {
  stopStoryAudio(audio.value, state)
})
</script>

<style scoped>
.music-button {
  margin-top: 1rem;
  border: 1px solid rgb(32 29 40 / 45%);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: transparent;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.music-data-hint {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  opacity: 0.75;
}

.music-error {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
}

.music-embed {
  width: min(100%, 22rem);
  margin-top: 1rem;
  overflow: hidden;
  border: 1px solid rgb(32 29 40 / 18%);
  border-radius: 0.85rem;
  background: #fff;
  box-shadow: 0 0.6rem 1.8rem rgb(32 29 40 / 12%);
}

.music-embed iframe {
  display: block;
  width: 100%;
  height: 9.5rem;
  border: 0;
}

.music-embed-album iframe,
.music-embed-playlist iframe,
.music-embed-show iframe {
  height: 22rem;
}

.music-embed-link {
  display: block;
  padding: 0.6rem 0.85rem;
  color: #fff;
  background: #1db954;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.music-embed-link:hover {
  background: #169c46;
}

.music-embed-youtube-music {
  width: min(100%, 25rem);
  aspect-ratio: 16 / 9;
}

.music-embed-youtube-music iframe {
  height: 100%;
  min-height: 14rem;
}
</style>
