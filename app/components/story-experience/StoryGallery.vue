<template>
  <section
    class="story-screen story-gallery"
    :class="`template-${templateId}`"
    data-story-section="gallery"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <header class="section-heading">
      <div>
        <p class="eyebrow">{{ galleryCopy.eyebrow }}</p>
        <h2>{{ galleryCopy.title }}</h2>
      </div>
      <p class="gallery-hint">{{ galleryCopy.hint }}</p>
    </header>
    <div
      ref="galleryTrack"
      class="gallery-track"
      role="region"
      aria-label="Galeri foto kenangan"
      tabindex="0"
      @keydown.left.prevent="scroll(-1)"
      @keydown.right.prevent="scroll(1)"
    >
      <div
        v-for="(photo, index) in photos"
        :key="`${index}-${photo.url}`"
        class="gallery-card"
      >
        <figure class="gallery-print">
          <img
            :src="photo.url"
            :alt="photo.caption || `Kenangan ${index + 1}`"
            :loading="index > 1 ? 'lazy' : 'eager'"
          >
          <figcaption>{{ photo.caption }}</figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StorySectionConfig } from '#shared/story-sections'
import type { StoryTemplateId } from '#shared/story-templates'
import { useStoryGallery } from '~/composables/story/useStoryGallery'

const props = defineProps<{
  story: StoryContent
  config: StorySectionConfig
}>()

const galleryTrack = useTemplateRef<HTMLDivElement>('galleryTrack')
const { scroll } = useStoryGallery(() => galleryTrack.value)
const photos = computed(() => props.story.gallery)
const templateId = computed<StoryTemplateId>(() => props.story.templateId ?? 'editorial-rose')
const galleryCopyByTemplate: Record<StoryTemplateId, { eyebrow: string; title: string; hint: string }> = {
  'editorial-rose': {
    eyebrow: 'The camera roll, but make it forever',
    title: 'Kita, dalam bingkai.',
    hint: 'Geser untuk melihat →',
  },
  'midnight-cinema': {
    eyebrow: 'selected scenes · the feature',
    title: 'Adegan yang ingin diulang.',
    hint: 'Bingkai berikutnya →',
  },
  'botanical-journal': {
    eyebrow: 'spesimen kenangan · no. 01',
    title: 'Jejak kecil perjalanan kita.',
    hint: 'Lembar berikutnya →',
  },
  'love-letter': {
    eyebrow: 'potongan kecil yang kusimpan',
    title: 'Halaman-halaman kesayanganku.',
    hint: 'Geser untuk melihat →',
  },
  'memory-atlas': {
    eyebrow: 'arsip lapangan · kumpulan foto',
    title: 'Foto-foto di sepanjang jalan.',
    hint: 'Geser arsip →',
  },
}
const galleryCopy = computed(() => galleryCopyByTemplate[templateId.value])
</script>

<style scoped>
.story-gallery {
  display: flex;
  flex-direction: column;
  gap: clamp(0.75rem, 2svh, 1.4rem);
  padding-inline: 0;
  color: white;
  background: #5045f5;
}

.section-heading {
  display: flex;
  min-height: 4.5rem;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  padding-inline: var(--screen-pad);
}

.section-heading h2 {
  margin: 0.3rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.7rem, 4vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.96;
}

.story-gallery .eyebrow {
  margin: 0;
  color: #d8f36a;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(0.58rem, 0.85vw, 0.76rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.5;
  text-transform: uppercase;
}

.gallery-hint {
  flex: 0 0 auto;
  margin: 0 0 0.25rem;
  color: rgb(255 255 255 / 70%);
  font-size: clamp(0.6rem, 1vw, 0.75rem);
}

.gallery-track {
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1;
  align-items: center;
  gap: clamp(0.75rem, 2vw, 2rem);
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  padding: 0 var(--screen-pad) 0.5rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: #d8f36a transparent;
}

.gallery-track::-webkit-scrollbar {
  height: 0.5rem;
}

.gallery-track::-webkit-scrollbar-thumb {
  border-width: 0.12rem;
  background: #d8f36a;
  background-clip: padding-box;
}

.gallery-track::-webkit-scrollbar-thumb:hover {
  background: #ff7968;
  background-clip: padding-box;
}

.gallery-card {
  width: min(76vw, 34rem);
  height: min(68svh, 36rem);
  flex: 0 0 auto;
  margin: 0;
  scroll-snap-align: center;
}

.gallery-card:nth-child(even) {
  transform: rotate(2deg);
}

.gallery-card:nth-child(odd) {
  transform: rotate(-2deg);
}

.gallery-print {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  margin: 0;
  border: 0.45rem solid white;
  border-bottom-width: clamp(2.5rem, 6svh, 3.5rem);
  border-radius: 1.4rem;
  padding: 0.4rem;
  background: white;
  box-shadow: 0 1.5rem 3rem rgb(20 14 56 / 24%);
}

.gallery-print img {
  width: 100%;
  min-height: 0;
  flex: 1;
  border-radius: 0.85rem;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

.gallery-card:hover .gallery-print img {
  transform: scale(1.035);
}

.gallery-print figcaption {
  overflow: hidden;
  padding: 0.45rem 0.3rem 0;
  color: #201d28;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 2.2vw, 1.45rem);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.story-gallery.template-editorial-rose {
  background-color: #9c6257;
  background-image: radial-gradient(ellipse at 50% 100%, rgb(255 250 245 / 15%), transparent 55%);
}

.story-gallery.template-editorial-rose .eyebrow {
  color: #f4c7b9;
}

.story-gallery.template-editorial-rose .gallery-card:nth-child(odd) { transform: rotate(-2deg); }
.story-gallery.template-editorial-rose .gallery-card:nth-child(even) { transform: rotate(2deg) translateY(0.7rem); }

.story-gallery.template-editorial-rose .gallery-print {
  border: 0.55rem solid #fffaf5;
  border-bottom-width: 2rem;
  background: #fffaf5;
  box-shadow: 0 0.8rem 1.8rem rgb(32 20 20 / 18%);
}

.story-gallery.template-midnight-cinema {
  background-color: #392b45;
  background-image:
    repeating-linear-gradient(90deg, transparent 0 3rem, rgb(255 255 255 / 3%) 3rem 3.1rem),
    linear-gradient(180deg, #392b45, #211a29);
}

.story-gallery.template-midnight-cinema .eyebrow {
  color: #d2a7ff;
}

.story-gallery.template-midnight-cinema .gallery-card {
  border: 1px solid rgb(210 167 255 / 45%);
  border-radius: 0.3rem;
  padding: 0.45rem;
  background: #120f17;
  box-shadow: 0 1rem 2rem rgb(0 0 0 / 35%);
}

.story-gallery.template-midnight-cinema .gallery-print { border-radius: 0.15rem; }
.story-gallery.template-midnight-cinema .gallery-print figcaption {
  color: #e2caff;
  font-family: 'Space Grotesk', sans-serif;
  letter-spacing: 0.06em;
}

.story-gallery.template-botanical-journal {
  background-color: #53684b;
  background-image: radial-gradient(ellipse at 50% 50%, rgb(220 229 200 / 12%), transparent 60%);
}

.story-gallery.template-botanical-journal .eyebrow {
  color: #dce5c8;
}

.story-gallery.template-botanical-journal .gallery-card:nth-child(odd) { transform: rotate(-1deg) translateY(-0.4rem); }
.story-gallery.template-botanical-journal .gallery-card:nth-child(even) { transform: rotate(1deg) translateY(0.4rem); }

.story-gallery.template-botanical-journal .gallery-print {
  border: 0.45rem solid #f8f4e8;
  background: #f8f4e8;
  box-shadow: 0 0.7rem 1.5rem rgb(20 30 18 / 20%);
}

.story-gallery.template-botanical-journal .gallery-print figcaption { color: #53684b; }

.story-gallery.template-love-letter {
  color: var(--letter-ink);
  background:
    radial-gradient(ellipse at 50% 30%, rgb(255 255 255 / 35%), transparent 64%),
    #d8b8a0;
}

.story-gallery.template-love-letter .eyebrow { color: #70463d; }

.story-gallery.template-love-letter .gallery-card {
  border: 1px solid rgb(73 54 47 / 18%);
  border-radius: 0.2rem;
  padding: 0.55rem;
  background: #f5e8d5;
  box-shadow: 0 1.5rem 3rem rgb(63 45 38 / 20%);
}

.story-gallery.template-love-letter .gallery-card:nth-child(odd) { transform: rotate(-1deg) translateY(-0.4rem); }
.story-gallery.template-love-letter .gallery-card:nth-child(even) { transform: rotate(1deg) translateY(0.4rem); }

.story-gallery.template-love-letter .gallery-print {
  border: 0;
  border-radius: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.story-gallery.template-love-letter .gallery-print img { border-radius: 0; }
.story-gallery.template-love-letter .gallery-print figcaption { color: #49362f; }

.story-gallery.template-memory-atlas {
  min-height: 34rem;
  gap: 2rem;
  color: var(--atlas-ink);
  background:
    radial-gradient(ellipse at 85% 85%, rgb(53 89 107 / 11%), transparent 48%),
    #f6f1e5;
}

.story-gallery.template-memory-atlas::after {
  position: absolute;
  top: 2rem;
  right: 2rem;
  color: var(--atlas-accent);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  content: '03 / FIELD PHOTOGRAPHS';
}

.story-gallery.template-memory-atlas .eyebrow { color: var(--atlas-accent); }
.story-gallery.template-memory-atlas .section-heading { align-items: start; padding-inline: 0; }
.story-gallery.template-memory-atlas .section-heading h2 {
  color: var(--atlas-ink);
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2.2rem, 5vw, 4.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
}
.story-gallery.template-memory-atlas .gallery-hint { color: rgb(37 57 67 / 65%); }

.story-gallery.template-memory-atlas .gallery-track {
  min-height: 26rem;
  flex: initial;
  padding-inline: 0;
}

.story-gallery.template-memory-atlas .gallery-card {
  width: min(66vw, 28rem);
  height: 25rem;
}

.story-gallery.template-memory-atlas .gallery-card:nth-child(n) { transform: none; }

.story-gallery.template-memory-atlas .gallery-print {
  border: 0.45rem solid #fffdf7;
  border-bottom-width: 2.8rem;
  border-radius: 0;
  background: #fffdf7;
  box-shadow: 0 0.8rem 1.8rem rgb(37 57 67 / 13%);
}

.story-gallery.template-memory-atlas .gallery-print img { border-radius: 0; }
.story-gallery.template-memory-atlas .gallery-print figcaption { color: var(--atlas-ink); }

.story-gallery[data-section-variant='film-strip'] .gallery-track {
  gap: 0.6rem;
}

.story-gallery[data-section-variant='film-strip'] .gallery-card {
  width: min(58vw, 26rem);
  height: min(55svh, 29rem);
}

.story-gallery[data-section-variant='film-strip'] .gallery-print {
  border-radius: 0.15rem;
}

.story-gallery[data-section-variant='archive'] .gallery-card:nth-child(n) {
  transform: none;
}

.story-gallery[data-section-variant='archive'] .gallery-print {
  border-radius: 0;
  box-shadow: none;
}

.story-gallery[data-section-variant='polaroid'] .gallery-card:nth-child(even) {
  transform: rotate(3deg) translateY(0.8rem);
}

.story-gallery[data-section-variant='polaroid'] .gallery-card:nth-child(odd) {
  transform: rotate(-3deg) translateY(-0.4rem);
}

@media (max-width: 700px) {
  .section-heading {
    min-height: 3.5rem;
  }

  .section-heading h2 {
    font-size: clamp(1.6rem, 7vw, 2.6rem);
  }

  .story-gallery {
    gap: 1rem;
    padding-top: 5rem;
    padding-bottom: 1rem;
  }

  .gallery-card {
    width: min(78vw, 25rem);
    height: min(64svh, 34rem);
  }
}

@media (max-width: 360px) {
  .gallery-hint {
    max-width: 5.5rem;
    text-align: right;
  }
}

@media (max-height: 600px) {
  .story-gallery {
    gap: 0.45rem;
  }

  .gallery-card {
    height: 58svh;
  }
}

@media (min-width: 901px) and (max-height: 820px) {
  .story-gallery {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

  .gallery-card {
    height: min(58svh, 32rem);
  }
}

@media (max-width: 700px) {
  .story-gallery.template-memory-atlas { min-height: 28rem; }
  .story-gallery.template-memory-atlas .section-heading { flex-direction: column; align-items: start; }
  .story-gallery.template-memory-atlas .gallery-track { min-height: 20rem; }
  .story-gallery.template-memory-atlas .gallery-card { width: 74vw; height: 19rem; }
}

@media (prefers-reduced-motion: reduce) {
  .gallery-print img {
    transition: none;
  }
}
</style>
