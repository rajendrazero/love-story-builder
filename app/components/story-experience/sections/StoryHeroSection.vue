<template>
  <section
    class="story-screen story-hero"
    data-story-section="hero"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="story-hero-copy">
      <p class="story-date">{{ story.date }}</p>
      <h1>{{ story.coupleNames }}</h1>
      <p class="story-title">{{ story.title }}</p>
      <p
        v-if="['editorial-rose', 'love-letter'].includes(templateId) && story.templateDetails?.editorialRose?.dedication"
        class="template-detail template-editorial-detail"
      >
        {{ story.templateDetails.editorialRose.dedication }}
      </p>
      <p
        v-else-if="templateId === 'midnight-cinema' && story.templateDetails?.midnightCinema?.openingQuote"
        class="template-detail template-cinema-detail"
      >
        “{{ story.templateDetails.midnightCinema.openingQuote }}”
      </p>
      <p
        v-else-if="templateId === 'botanical-journal' && story.templateDetails?.botanicalJournal?.journalLabel"
        class="template-detail template-botanical-detail"
      >
        {{ story.templateDetails.botanicalJournal.journalLabel }}
      </p>
    </div>
    <figure class="story-hero-photo">
      <img :src="story.heroImage" :alt="story.coupleNames">
      <figcaption>this is so us ♡</figcaption>
    </figure>
    <span class="hero-sparkle" aria-hidden="true">✳</span>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StorySectionConfig } from '#shared/story-sections'

const props = defineProps<{
  story: StoryContent
  config: StorySectionConfig
}>()

const templateId = computed(() => props.story.templateId ?? 'editorial-rose')
</script>

<style scoped>
.story-hero[data-section-variant='cinema-poster'] .story-hero-photo {
  border-radius: 0.25rem;
  transform: rotate(0);
}

.story-hero[data-section-variant='cinema-poster'] .story-hero-photo img {
  filter: saturate(0.72);
}

.story-hero[data-section-variant='field-notes'] .story-hero-photo {
  border-radius: 0.25rem;
  transform: rotate(-1deg);
}

.story-hero[data-section-variant='letter-cover'] .story-hero-photo {
  border-radius: 0;
  transform: rotate(1deg);
}

.story-hero[data-section-variant='atlas-cover'] .story-hero-photo {
  border-radius: 0;
  transform: rotate(0);
}

.story-hero[data-section-variant='atlas-cover'] .story-hero-copy {
  border-left: 1px solid rgb(37 57 67 / 28%);
  padding-left: clamp(1rem, 3vw, 2rem);
}
</style>
