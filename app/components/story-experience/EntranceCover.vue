<template>
  <section
    class="entrance-cover"
    :class="[
      `entrance-cover-${entrance.style}`,
      preview ? `entrance-cover-preview-${previewSize}` : '',
    ]"
    :aria-labelledby="entranceTitleId"
  >
    <img class="entrance-cover-image" :src="story.heroImage" alt="">
    <div class="entrance-cover-shade" />
    <DecorativeLayer
      class="entrance-cover-decorations"
      :template-id="story.templateId ?? 'editorial-rose'"
      scene="entrance"
    />
    <div class="entrance-cover-content">
      <p class="entrance-eyebrow">SELAMANYA · A PLACE FOR YOUR STORY</p>
      <p class="entrance-to">Untuk {{ story.coupleNames || 'Kalian berdua' }}</p>
      <h1 :id="entranceTitleId">{{ story.title || 'Kisah kita, selamanya' }}</h1>
      <p class="entrance-prompt">Sebuah cerita kecil menunggu untuk dibuka.</p>
      <span
        v-if="preview"
        class="entrance-open-button entrance-preview-action"
        aria-hidden="true"
      >
        <span class="entrance-object" aria-hidden="true">{{ entranceSymbol }}</span>
        <span>{{ entrance.actionLabel }}</span>
      </span>
      <button
        v-else
        id="entrance-open"
        ref="openButton"
        type="button"
        class="entrance-open-button"
        :class="{ 'entrance-open-button-active': opening }"
        @click="openStory"
      >
        <span class="entrance-object" aria-hidden="true">{{ entranceSymbol }}</span>
        <span>{{ entrance.actionLabel }}</span>
      </button>
      <p class="entrance-audio-note">Musik, jika tersedia, dimulai saat cerita dibuka.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import { getTemplateEntrance } from '#shared/story-templates'
import { useStoryMusicEngine } from '~/composables/story/music-engine'
import DecorativeLayer from './DecorativeLayer.vue'

const props = defineProps<{
  story: Pick<StoryContent, 'coupleNames' | 'entranceStyle' | 'heroImage' | 'templateId' | 'title'>
  preview?: boolean
  previewSize?: 'small' | 'large'
}>()
const emit = defineEmits<{
  open: []
}>()

const openButton = useTemplateRef<HTMLButtonElement>('openButton')
const entranceTitleId = `entrance-title-${useId()}`
const opening = shallowRef(false)
const music = props.preview ? undefined : useStoryMusicEngine()
const entrance = computed(() => getTemplateEntrance(
  props.story.entranceStyle,
  props.story.templateId ?? 'editorial-rose',
))
const entranceSymbol = computed(() => ({
  editorial: '✦',
  cinema: '▶',
  botanical: '❋',
  letter: '♡',
  atlas: '✧',
})[entrance.value.style])
let previousBodyOverflow = ''

function openStory(): void {
  if (opening.value) return
  opening.value = true
  if (music?.hasTrack.value) void music.toggle()
  emit('open')
}

onMounted(() => {
  if (props.preview) return
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  openButton.value?.focus()
})

onBeforeUnmount(() => {
  if (props.preview) return
  document.body.style.overflow = previousBodyOverflow
})
</script>

<style scoped>
.entrance-cover {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  min-height: 100vh;
  min-height: 100svh;
  place-items: center;
  overflow: hidden;
  padding: clamp(1.25rem, 5vw, 4rem);
  color: #fffaf5;
  background: #211b24;
  isolation: isolate;
}

.entrance-cover-image,
.entrance-cover-shade {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
}

.entrance-cover-image {
  object-fit: cover;
  filter: saturate(0.78);
}

.entrance-cover-shade {
  z-index: -1;
  background: linear-gradient(110deg, rgb(26 21 25 / 82%), rgb(26 21 25 / 28%) 68%, rgb(26 21 25 / 48%));
}

.entrance-cover-cinema .entrance-cover-shade {
  background: linear-gradient(180deg, rgb(15 14 21 / 74%), rgb(15 14 21 / 46%) 52%, rgb(15 14 21 / 86%));
}

.entrance-cover-botanical .entrance-cover-shade {
  background: linear-gradient(110deg, rgb(33 39 29 / 80%), rgb(33 39 29 / 34%) 70%, rgb(33 39 29 / 58%));
}

.entrance-cover-decorations {
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: 0.72;
}

.entrance-cover-content {
  width: min(100%, 46rem);
  text-align: center;
  animation: entrance-arrive 800ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.entrance-eyebrow {
  margin: 0;
  color: #f1d9a8;
  font-size: 0.65rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.entrance-to {
  margin: clamp(2.5rem, 8vh, 5rem) 0 0;
  font-family: var(--font-family-display);
  font-size: clamp(1rem, 2vw, 1.3rem);
}

.entrance-cover h1 {
  max-width: 16ch;
  margin: 0.75rem auto 0;
  font-family: var(--font-family-display);
  font-size: clamp(2.75rem, 8vw, 6.5rem);
  font-weight: 400;
  line-height: 0.95;
  text-wrap: balance;
}

.entrance-prompt {
  margin: 1.1rem 0 0;
  color: rgb(255 250 245 / 78%);
  font-size: clamp(0.85rem, 2vw, 1.05rem);
}

.entrance-open-button {
  display: inline-flex;
  min-height: 3.25rem;
  align-items: center;
  gap: 0.8rem;
  margin-top: clamp(1.5rem, 5vh, 2.5rem);
  border: 1px solid rgb(241 217 168 / 72%);
  border-radius: 999px;
  padding: 0.5rem 1.25rem 0.5rem 0.6rem;
  color: #211b24;
  background: #f1d9a8;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 220ms ease, background-color 220ms ease;
}

.entrance-open-button:hover {
  transform: translateY(-2px);
  background: #fff0c8;
}

.entrance-open-button:focus-visible {
  outline: 3px solid #fffaf5;
  outline-offset: 4px;
}

.entrance-object {
  display: grid;
  width: 2.15rem;
  height: 2.15rem;
  place-items: center;
  border-radius: 50%;
  color: #fffaf5;
  background: #9c6257;
  font-size: 1.1rem;
  transition: transform 550ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.entrance-cover-letter .entrance-object {
  border-radius: 0.4rem 0.4rem 0.65rem 0.65rem;
}

.entrance-cover-cinema .entrance-object {
  border-radius: 0.55rem;
  background: #7256a0;
}

.entrance-open-button-active .entrance-object {
  transform: rotate(12deg) scale(1.12);
}

.entrance-audio-note {
  margin: 0.85rem 0 0;
  color: rgb(255 250 245 / 62%);
  font-size: 0.72rem;
}

.entrance-cover-preview-small,
.entrance-cover-preview-large {
  position: relative;
  inset: auto;
  z-index: 0;
  min-height: 0;
  border-radius: var(--radius-large);
  padding: clamp(0.75rem, 3vw, 2rem);
}

.entrance-cover-preview-small {
  height: 10.5rem;
}

.entrance-cover-preview-large {
  min-height: min(72svh, 48rem);
}

.entrance-cover-preview-small .entrance-cover-content,
.entrance-cover-preview-large .entrance-cover-content {
  animation: none;
}

.entrance-cover-preview-small .entrance-eyebrow,
.entrance-cover-preview-small .entrance-audio-note {
  display: none;
}

.entrance-cover-preview-small .entrance-to {
  margin-top: 0;
  font-size: 0.72rem;
}

.entrance-cover-preview-small h1 {
  font-size: clamp(1.3rem, 5vw, 2rem);
}

.entrance-cover-preview-small .entrance-prompt {
  margin-top: 0.45rem;
  font-size: 0.65rem;
}

.entrance-cover-preview-small .entrance-open-button {
  min-height: 2rem;
  gap: 0.4rem;
  margin-top: 0.55rem;
  padding: 0.25rem 0.7rem 0.25rem 0.3rem;
  font-size: 0.65rem;
}

.entrance-cover-preview-small .entrance-object {
  width: 1.4rem;
  height: 1.4rem;
  font-size: 0.8rem;
}

@media (prefers-reduced-motion: reduce) {
  .entrance-cover-content,
  .entrance-object,
  .entrance-open-button {
    animation: none;
    transition: none;
  }
}

@keyframes entrance-arrive {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .entrance-cover {
    padding: 1.25rem;
  }

  .entrance-cover-shade {
    background: linear-gradient(180deg, rgb(26 21 25 / 50%), rgb(26 21 25 / 70%));
  }

  .entrance-cover h1 {
    font-size: clamp(2.6rem, 13vw, 4.25rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .entrance-cover-content {
    animation: none;
  }

  .entrance-open-button,
  .entrance-object {
    transition: none;
  }
}
</style>
