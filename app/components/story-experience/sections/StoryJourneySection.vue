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

<template>
  <section
    class="story-screen story-creative-section"
    :class="[`creative-${config.type}`, `template-${templateId}`]"
    :data-story-section="config.type"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="creative-frame">
      <template v-if="config.type === 'timeline'">
        <header class="creative-heading">
          <p class="creative-eyebrow">{{ story.date }} · catatan perjalanan</p>
          <h2>{{ story.detailTitle }}</h2>
          <p>{{ story.detailText }}</p>
        </header>
        <ol class="timeline-list">
          <li v-for="(page, index) in story.storyPages" :key="`${index}-${page.title}`" class="timeline-item">
            <span class="timeline-marker" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
            <img :src="page.image" :alt="page.title" loading="lazy">
            <div>
              <p class="creative-eyebrow">Momen {{ String(index + 1).padStart(2, '0') }}</p>
              <h3>{{ page.title }}</h3>
              <p>{{ page.text }}</p>
            </div>
          </li>
        </ol>
      </template>
      <template v-else>
        <header class="creative-heading">
          <p class="creative-eyebrow">Konstelasi kenangan</p>
          <h2>Semua titik ini mengarah kepadamu.</h2>
        </header>
        <div class="constellation" role="list" aria-label="Kenangan yang membentuk konstelasi">
          <article
            v-for="(page, index) in story.storyPages"
            :key="`${index}-${page.title}`"
            class="constellation-star"
            :style="{ '--star-index': index }"
            role="listitem"
          >
            <span class="star-point" aria-hidden="true">✦</span>
            <h3>{{ page.title }}</h3>
            <p>{{ page.text }}</p>
          </article>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.story-creative-section {
  display: grid;
  align-items: center;
  padding-inline: var(--screen-pad);
  background: #e8e2d2;
  color: #201d28;
}

.creative-frame {
  width: min(100%, 74rem);
  margin-inline: auto;
}

.creative-heading {
  max-width: 46rem;
  margin: 0 auto clamp(2rem, 6svh, 4rem);
  text-align: center;
}

.creative-heading h2 {
  margin: 0.6rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 400;
  line-height: 0.98;
}

.creative-heading > p:last-child,
.timeline-item p:last-child {
  color: #756a62;
  line-height: 1.7;
}

.creative-eyebrow {
  margin: 0;
  color: #9c6257;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.timeline-list {
  position: relative;
  display: grid;
  gap: clamp(1.5rem, 4vw, 3rem);
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-list::before {
  position: absolute;
  top: 1rem;
  bottom: 1rem;
  left: 1.1rem;
  width: 1px;
  background: rgb(53 89 107 / 30%);
  content: '';
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: minmax(5rem, 0.7fr) minmax(0, 1fr);
  align-items: center;
  gap: clamp(1rem, 4vw, 3rem);
  padding-left: 3.25rem;
}

.timeline-item img {
  width: 100%;
  max-height: 22rem;
  aspect-ratio: 4 / 3;
  border-radius: 0.3rem;
  object-fit: cover;
}

.timeline-item h3 {
  margin: 0.4rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.5rem, 3vw, 2.5rem);
}

.timeline-marker {
  position: absolute;
  top: 50%;
  left: 0;
  z-index: 1;
  display: grid;
  width: 2.2rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid #35596b;
  border-radius: 50%;
  background: #e8e2d2;
  color: #35596b;
  font-size: 0.65rem;
  transform: translateY(-50%);
}

.creative-timeline[data-section-variant='cinematic'] .timeline-item img {
  aspect-ratio: 16 / 9;
  filter: saturate(0.78);
}

.creative-timeline[data-section-variant='route-log'] .timeline-marker {
  border-radius: 0.2rem;
  transform: translateY(-50%) rotate(45deg);
}

.creative-constellation {
  background: #211b2a;
  color: #fffaf5;
}

.constellation {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1.25rem;
}

.constellation-star {
  min-height: 12rem;
  border-top: 1px solid rgb(255 250 245 / 28%);
  padding: 1rem 0;
}

.star-point {
  color: #d8f36a;
  font-size: 1.5rem;
}

.constellation-star h3 {
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
  font-weight: 400;
}

.constellation-star p {
  color: rgb(255 250 245 / 70%);
  line-height: 1.65;
}

.creative-constellation[data-section-variant='memory-orbit'] .constellation-star:nth-child(even) {
  transform: translateY(1.25rem);
}

@media (max-width: 640px) {
  .timeline-item {
    grid-template-columns: 1fr;
    gap: 0.8rem;
    padding-left: 2.75rem;
  }

  .timeline-item img {
    max-height: 16rem;
  }
}
</style>
