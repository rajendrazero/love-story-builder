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
    v-if="config.type === 'moments-in-motion'"
    class="story-screen story-creative-section creative-moments-in-motion"
    :class="`template-${templateId}`"
    :data-story-section="config.type"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="creative-frame">
      <header class="creative-heading">
        <p class="creative-eyebrow">Satu momen yang bergerak</p>
        <h2>{{ story.detailTitle }}</h2>
      </header>
      <video
        class="moments-video"
        :src="story.greetingVideoUrl"
        controls
        muted
        playsinline
        preload="metadata"
        aria-label="Video kenangan kalian"
      />
    </div>
  </section>
  <section
    v-else
    class="story-screen story-creative-section creative-music"
    :class="`template-${templateId}`"
    :data-story-section="config.type"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="creative-frame">
      <div class="creative-note">
        <span class="music-orbit" aria-hidden="true">♫</span>
        <div>
          <p class="creative-eyebrow">Soundtrack kita</p>
          <h2>{{ story.musicTitle || 'Satu lagu, banyak kenangan.' }}</h2>
          <p>{{ story.musicArtist || story.coupleNames }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.story-creative-section {
  display: grid;
  align-items: center;
  padding-inline: var(--screen-pad);
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

.creative-heading h2,
.creative-note h2 {
  margin: 0.6rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 400;
  line-height: 0.98;
}

.creative-eyebrow {
  margin: 0;
  color: #9c6257;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.creative-moments-in-motion {
  background: #201d28;
  color: #fffaf5;
}

.moments-video {
  display: block;
  width: min(100%, 68rem);
  max-height: 72svh;
  margin-inline: auto;
  background: #09090b;
  object-fit: contain;
}

.creative-music {
  background: #ffcfbe;
}

.creative-note {
  display: flex;
  max-width: 58rem;
  align-items: center;
  gap: clamp(1.5rem, 6vw, 5rem);
  margin-inline: auto;
}

.creative-note > div > p:last-child {
  color: #756a62;
  line-height: 1.7;
}

.music-orbit {
  display: grid;
  width: clamp(5rem, 14vw, 10rem);
  flex: 0 0 auto;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgb(32 29 40 / 40%);
  border-radius: 50%;
  font-size: clamp(2rem, 7vw, 5rem);
}

@media (max-width: 640px) {
  .creative-note {
    align-items: flex-start;
  }
}
</style>
