<template>
  <StoryExperience :story="demoStory" demo />
</template>

<script setup lang="ts">
import { demoStory } from '#shared/demo-story'

useSeoMeta({
  title: 'Pratinjau Template — Selamanya',
  description: 'Lihat contoh halaman cerita cinta sinematik sebelum membuat ceritamu sendiri.',
})
</script>
