<template>
  <component
    :is="renderer"
    :story="story"
    :config="section"
    v-bind="storyContext"
  />
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StorySectionConfig, StorySectionType } from '#shared/story-sections'
import StoryBookInteraction from './StoryBookInteraction.vue'
import StoryGallery from './StoryGallery.vue'
import StorySectionRenderer from './StorySectionRenderer.vue'
import StoryDetailsSection from './sections/StoryDetailsSection.vue'
import StoryHeroSection from './sections/StoryHeroSection.vue'
import StoryJourneySection from './sections/StoryJourneySection.vue'
import StoryMediaSection from './sections/StoryMediaSection.vue'
import StoryMemoryCapsuleSection from './sections/StoryMemoryCapsuleSection.vue'

const props = defineProps<{
  story: StoryContent
  section: StorySectionConfig
  storySlug?: string
  storyPassword?: string
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

const renderer = computed(() => sectionRenderers[props.section.type])
const storyContext = computed(() => props.section.type === 'memory-capsule'
  ? {
      ...(props.storySlug ? { storySlug: props.storySlug } : {}),
      ...(props.storyPassword ? { storyPassword: props.storyPassword } : {}),
    }
  : {})
</script>
