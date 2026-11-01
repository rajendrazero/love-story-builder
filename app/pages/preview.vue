<template>
  <StoryExperience
    :story="previewStory"
    :create-to="`/studio?template=${previewTemplate}&new=1`"
    demo
    template-picker
    @select-template="previewTemplate = $event"
  />
</template>

<script setup lang="ts">
import { demoStory } from '#shared/demo-story'
import { availableStoryTemplates, type StoryTemplateId } from '#shared/story-templates'

const previewTemplate = ref<StoryTemplateId>('editorial-rose')
const previewStory = computed(() => ({ ...demoStory, templateId: previewTemplate.value }))
useSeoMeta({
  title: 'Pratinjau template — Selamanya',
  description: () => `Lihat preview ${availableStoryTemplates.find(template => template.id === previewTemplate.value)?.name ?? 'cerita'} sebelum membuat ceritamu sendiri.`,
})
</script>
