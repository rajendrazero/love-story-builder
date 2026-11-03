<script setup lang="ts">
import { computed, type Component, type CSSProperties } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import { createDefaultStoryAppearance } from '#shared/story-appearance'
import {
  createDefaultStorySectionDesign,
  type StorySectionConfig,
  type StorySectionType,
} from '#shared/story-sections'
import type { StoryTemplateId } from '#shared/story-templates'
import StoryBookInteraction from './StoryBookInteraction.vue'
import DecorativeLayer from './DecorativeLayer.vue'
import StoryGallery from './StoryGallery.vue'
import StorySectionRenderer from './StorySectionRenderer.vue'
import StoryDetailsSection from './sections/StoryDetailsSection.vue'
import StoryHeroSection from './sections/StoryHeroSection.vue'
import StoryJourneySection from './sections/StoryJourneySection.vue'
import StoryMediaSection from './sections/StoryMediaSection.vue'
import StoryMemoryCapsuleSection from './sections/StoryMemoryCapsuleSection.vue'

type DecorativeScene = 'hero' | 'gallery' | 'book' | 'greeting' | 'detail' | 'finale'

const props = defineProps<{
  story: StoryContent
  section: StorySectionConfig
  storySlug?: string
  storyPassword?: string
  preview?: boolean
}>()

const sectionRenderers = {
  hero: StoryHeroSection,
  greeting: StorySectionRenderer,
  'first-encounter': StorySectionRenderer,
  gallery: StoryGallery,
  'moments-in-motion': StoryMediaSection,
  music: StoryMediaSection,
  timeline: StoryJourneySection,
  'love-notes': StoryDetailsSection,
  constellation: StoryJourneySection,
  'distance-map': StoryDetailsSection,
  'future-dreams': StoryDetailsSection,
  countdown: StoryDetailsSection,
  'memory-capsule': StoryMemoryCapsuleSection,
  book: StoryBookInteraction,
  finale: StorySectionRenderer,
} satisfies Record<StorySectionType, Component>

const templateId = computed<StoryTemplateId>(() => props.story.templateId ?? 'editorial-rose')
const design = computed(() => props.section.design ?? createDefaultStorySectionDesign(props.section.type))
const appearance = computed(() => props.story.appearance ?? createDefaultStoryAppearance(templateId.value))
const background = computed(() => design.value.background)
const customBackground = computed(() => background.value.type !== 'theme')
const backgroundStyle = computed<CSSProperties>(() => ({
  backgroundColor: background.value.type === 'color'
    ? background.value.color
    : appearance.value.backgroundColor,
}))
const renderer = computed(() => sectionRenderers[props.section.type])
const storyContext = computed(() => {
  if (props.section.type === 'memory-capsule') {
    return {
      ...(props.storySlug ? { storySlug: props.storySlug } : {}),
      ...(props.storyPassword ? { storyPassword: props.storyPassword } : {}),
      ...(props.preview ? { preview: true } : {}),
    }
  }

  return props.section.type === 'moments-in-motion' && props.preview
    ? { preview: true }
    : {}
})
const decorationScene = computed<DecorativeScene>(() => {
  if (props.section.type === 'hero') return 'hero'
  if (props.section.type === 'gallery') return 'gallery'
  if (props.section.type === 'book') return 'book'
  if (props.section.type === 'greeting') return 'greeting'
  if (props.section.type === 'finale') return 'finale'
  return 'detail'
})
const decorationStyle = computed<CSSProperties>(() => ({
  left: `${design.value.ornament.x}%`,
  top: `${design.value.ornament.y}%`,
  right: 'auto',
  bottom: 'auto',
  width: '100%',
  height: '100%',
  transform: `translate(-50%, -50%) scale(${design.value.ornament.scale / 100})`,
}))
</script>

<template>
  <div
    class="story-section-host"
    :class="{ 'story-section-host-custom-background': customBackground }"
    :style="backgroundStyle"
  >
    <div class="story-section-background" aria-hidden="true">
      <img
        v-if="background.type === 'image' && background.url"
        class="story-section-background-media"
        :src="background.url"
        alt=""
        :loading="section.type === 'hero' ? 'eager' : 'lazy'"
      >
      <video
        v-else-if="background.type === 'video' && background.url"
        class="story-section-background-media"
        :src="background.url"
        autoplay
        muted
        loop
        playsinline
        preload="metadata"
        tabindex="-1"
      />
    </div>
    <DecorativeLayer
      v-if="design.ornament.enabled"
      class="story-section-decorations"
      :template-id="templateId"
      :scene="decorationScene"
      :style="decorationStyle"
    />
    <div class="story-section-content">
      <component
        :is="renderer"
        :story="story"
        :config="section"
        v-bind="storyContext"
      />
    </div>
  </div>
</template>

<style scoped>
.story-section-host {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.story-section-background {
  position: absolute;
  z-index: 0;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.story-section-background-media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-section-decorations {
  z-index: 1;
  opacity: 0.2;
}

.story-section-content {
  position: relative;
  z-index: 2;
}

.story-section-host :deep(.story-screen) {
  position: relative;
  background-color: transparent !important;
  color: var(--story-text-color) !important;
}

.story-section-host-custom-background :deep(.story-screen) {
  background-image: none !important;
}

.story-section-host :deep(.story-screen *) {
  color: var(--story-text-color) !important;
  font-family: var(--story-font-body) !important;
}

.story-section-host :deep(.story-screen :is(h1, h2, h3, .story-title, .greeting-text, .final-message)) {
  font-family: var(--story-font-display) !important;
}

.story-section-host :deep(.story-screen :is(.eyebrow, .story-title, .hero-sparkle, .final-sparkle)) {
  color: var(--story-accent-color) !important;
}

.story-section-host :deep(.story-screen .story-date) {
  color: var(--story-accent-contrast-color) !important;
  background-color: var(--story-accent-color) !important;
}

.story-section-host :deep(.story-screen :is(.book-page, .gallery-print, .creative-card, .story-card)) {
  background-color: var(--story-surface-color);
}

@media (prefers-reduced-motion: reduce) {
  .story-section-background-media:is(video) {
    display: none;
  }
}
</style>
