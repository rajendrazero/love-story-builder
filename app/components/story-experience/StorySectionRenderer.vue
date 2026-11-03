<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StoryTemplateId } from '#shared/story-templates'
import type { StorySectionConfig } from '#shared/story-sections'

interface SectionCopy {
  greetingEyebrow: string
  greetingSticker: string
  detailSticker: string
  finaleCaption: string
  finaleEyebrow: string
}

const props = defineProps<{
  story: StoryContent
  config: StorySectionConfig
}>()

const greetingVideo = ref<HTMLVideoElement | null>(null)
const videoAutoplay = ref(false)
let reducedMotionQuery: MediaQueryList | undefined

function updateMotionPreference() {
  if (reducedMotionQuery?.matches) {
    videoAutoplay.value = false
    greetingVideo.value?.pause()
  }
}

onMounted(() => {
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  videoAutoplay.value = !reducedMotionQuery.matches
  updateMotionPreference()
  reducedMotionQuery.addEventListener('change', updateMotionPreference)
})

onBeforeUnmount(() => {
  reducedMotionQuery?.removeEventListener('change', updateMotionPreference)
})

const templateId = computed(() => props.story.templateId ?? 'editorial-rose')
const sectionType = computed(() => props.config.type)
const sectionCopyByTemplate: Record<StoryTemplateId, SectionCopy> = {
  'editorial-rose': {
    greetingEyebrow: 'Untukmu, selalu ♡',
    greetingSticker: 'one for the scrapbook ✳',
    detailSticker: 'my favorite person ♡',
    finaleCaption: 'keep this one forever ♡',
    finaleEyebrow: 'sampai halaman terakhir ✳',
  },
  'midnight-cinema': {
    greetingEyebrow: 'Adegan favorit kita',
    greetingSticker: 'SCENE 01 · US',
    detailSticker: 'THE LEAD, ALWAYS',
    finaleCaption: 'THE END? NEVER.',
    finaleEyebrow: 'roll credits · just the beginning',
  },
  'botanical-journal': {
    greetingEyebrow: 'Catatan untukmu',
    greetingSticker: 'disimpan di jurnal ✳',
    detailSticker: 'tumbuh bersama ♡',
    finaleCaption: 'kenangan yang terus tumbuh ♡',
    finaleEyebrow: 'akhir catatan · awal perjalanan',
  },
  'love-letter': {
    greetingEyebrow: 'Surat yang kusimpan',
    greetingSticker: 'disimpan di antara halaman ♡',
    detailSticker: 'my favorite person ♡',
    finaleCaption: 'PS. aku memilihmu lagi ♡',
    finaleEyebrow: 'sampai surat berikutnya',
  },
  'memory-atlas': {
    greetingEyebrow: 'Catatan perjalanan · 01',
    greetingSticker: 'arsip perjalanan · 01',
    detailSticker: 'titik awal perjalanan',
    finaleCaption: 'satu koordinat menuju rumah ♡',
    finaleEyebrow: 'peta selesai · perjalanan berlanjut',
  },
}

const sectionCopy = computed(() => sectionCopyByTemplate[templateId.value])
</script>

<template>
  <section
    v-if="sectionType === 'greeting'"
    class="story-screen story-greeting"
    :class="`template-${templateId}`"
    data-story-section="greeting"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="greeting-copy">
      <p class="eyebrow">{{ sectionCopy.greetingEyebrow }}</p>
      <p class="greeting-text">{{ story.greetingText }}</p>
      <p
        v-if="story.templateId === 'botanical-journal' && story.templateDetails?.botanicalJournal?.fieldNote"
        class="template-field-note"
      >
        {{ story.templateDetails.botanicalJournal.fieldNote }}
      </p>
    </div>
    <div class="greeting-photo">
      <video
        v-if="story.greetingVideoUrl"
        ref="greetingVideo"
        :src="story.greetingVideoUrl"
        :autoplay="videoAutoplay"
        muted
        loop
        playsinline
        controls
        aria-label="Video kartu ucapan"
      />
      <img v-else :src="story.greetingImage" alt="Kartu ucapan">
      <span class="photo-sticker">{{ sectionCopy.greetingSticker }}</span>
    </div>
  </section>

  <section
    v-else-if="sectionType === 'first-encounter'"
    class="story-screen story-detail"
    :class="`template-${templateId}`"
    data-story-section="first-encounter"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <div class="detail-photo">
      <img :src="story.secondImage" :alt="story.coupleNames" loading="lazy">
      <span class="photo-sticker">{{ sectionCopy.detailSticker }}</span>
    </div>
    <div class="detail-copy">
      <p class="eyebrow">{{ story.date }}</p>
      <h2>{{ story.detailTitle }}</h2>
      <p>{{ story.detailText }}</p>
    </div>
  </section>

  <section
    v-else
    class="story-screen story-finale"
    :class="`template-${templateId}`"
    data-story-section="finale"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <figure class="final-photo">
      <img :src="story.finalImage" alt="Foto kenangan terakhir" loading="lazy">
      <figcaption>{{ sectionCopy.finaleCaption }}</figcaption>
    </figure>
    <div class="final-copy">
      <p class="eyebrow">{{ sectionCopy.finaleEyebrow }}</p>
      <p class="final-message">{{ story.finalMessage }}</p>
      <p v-if="story.templateId === 'midnight-cinema' && story.templateDetails?.midnightCinema?.credits" class="final-signature">
        {{ story.templateDetails.midnightCinema.credits }}
      </p>
      <p v-else-if="['editorial-rose', 'love-letter'].includes(story.templateId ?? '') && story.templateDetails?.editorialRose?.signature" class="final-signature">
        {{ story.templateDetails.editorialRose.signature }}
      </p>
      <p v-else class="final-signature">{{ story.coupleNames }} · {{ story.date }}</p>
    </div>
    <span class="final-sparkle" aria-hidden="true">✳</span>
  </section>
</template>

<style scoped>
.eyebrow {
  margin: 0;
  color: #5045f5;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(0.58rem, 0.85vw, 0.76rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.5;
  text-transform: uppercase;
}

.greeting-copy,
.detail-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(0.75rem, 4vw, 4rem);
}

.greeting-text {
  max-width: 18ch;
  margin: clamp(0.75rem, 3svh, 2rem) 0 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2rem, 5vw, 5.2rem);
  line-height: 1;
  overflow-wrap: anywhere;
}

.greeting-photo {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.greeting-photo img,
.greeting-photo video,
.detail-photo img,
.final-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.greeting-photo img,
.greeting-photo video {
  position: absolute;
  inset: 0;
}

.photo-sticker {
  position: absolute;
  right: clamp(0.6rem, 2vw, 1.5rem);
  bottom: clamp(0.6rem, 2vw, 1.5rem);
  max-width: calc(100% - 1.2rem);
  border-radius: 999px;
  padding: 0.55rem 0.8rem;
  background: #d8f36a;
  font-size: clamp(0.55rem, 0.85vw, 0.72rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transform: rotate(-3deg);
}

.template-field-note {
  margin-top: 1.5rem;
  border-left: 2px solid #53684b;
  padding-left: 1rem;
  color: #53684b;
  font-size: 0.9rem;
  font-style: italic;
  line-height: 1.6;
}

.detail-photo {
  position: relative;
  width: 100%;
  height: min(72svh, 44rem);
  min-height: 0;
  overflow: hidden;
  border: clamp(0.4rem, 1.1vw, 0.8rem) solid white;
  border-radius: 1.6rem;
  padding: 0.3rem;
  background: white;
  box-shadow: 0 1.5rem 3rem rgb(32 29 40 / 14%);
  transform: rotate(-2deg);
}

.detail-photo img {
  border-radius: 1.1rem;
}

.detail-copy h2 {
  margin: clamp(0.6rem, 2svh, 1.3rem) 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2rem, 5.3vw, 5.5rem);
  font-weight: 700;
  letter-spacing: -0.065em;
  line-height: 0.95;
  overflow-wrap: anywhere;
}

.detail-copy > p:last-child {
  max-width: 42rem;
  margin: 0;
  color: rgb(32 29 40 / 70%);
  font-size: clamp(0.8rem, 1.3vw, 1.05rem);
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.final-photo {
  position: relative;
  width: min(100%, 28rem);
  height: min(68svh, 42rem);
  justify-self: center;
  margin: 0;
  overflow: hidden;
  border: 0.6rem solid white;
  border-bottom-width: clamp(2.5rem, 6svh, 3.5rem);
  padding: 0.4rem;
  background: white;
  box-shadow: 0 1.5rem 3rem rgb(32 29 40 / 22%);
  transform: rotate(-3deg);
}

.final-photo img {
  height: 100%;
}

.final-photo figcaption {
  position: absolute;
  bottom: 0.45rem;
  left: 1rem;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-style: italic;
}

.final-copy {
  position: relative;
  z-index: 2;
  max-width: 40rem;
  border-radius: 1.5rem;
  padding: clamp(1rem, 4vw, 3rem);
  background: #d8f36a;
  box-shadow: 0 1.5rem 3rem rgb(32 29 40 / 14%);
}

.final-message {
  margin: clamp(0.7rem, 2svh, 1.5rem) 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2rem, 5vw, 5rem);
  line-height: 0.98;
  overflow-wrap: anywhere;
}

.final-signature {
  margin: 0;
  font-size: clamp(0.7rem, 1.1vw, 0.9rem);
  font-weight: 700;
}

.final-sparkle {
  position: absolute;
  z-index: 2;
  right: 4%;
  bottom: 8%;
  color: #5045f5;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(4rem, 8vw, 8rem);
  pointer-events: none;
}

.story-greeting.template-editorial-rose .photo-sticker,
.story-finale.template-editorial-rose .final-copy {
  background: #f2d9d4;
}

.story-greeting.template-editorial-rose .eyebrow,
.story-detail.template-editorial-rose .eyebrow,
.story-finale.template-editorial-rose .eyebrow {
  color: #8d4c50;
}

.story-finale.template-editorial-rose .final-sparkle {
  color: #8d4c50;
}

.story-detail.template-midnight-cinema .detail-copy > p:last-child {
  color: rgb(246 237 247 / 75%);
}

.story-greeting.template-midnight-cinema .eyebrow,
.story-detail.template-midnight-cinema .eyebrow,
.story-finale.template-midnight-cinema .eyebrow {
  color: #d2a7ff;
}

.story-greeting.template-midnight-cinema .photo-sticker,
.story-detail.template-midnight-cinema .photo-sticker {
  color: #211b29;
  background: #d2a7ff;
}

.story-greeting.template-midnight-cinema .greeting-copy {
  position: relative;
}

.story-greeting.template-midnight-cinema .greeting-copy::before {
  position: absolute;
  top: -4rem;
  left: -1rem;
  color: rgb(210 167 255 / 16%);
  content: '“';
  font-family: 'Instrument Serif', serif;
  font-size: clamp(8rem, 16vw, 15rem);
  line-height: 1;
}

.story-finale.template-midnight-cinema .final-copy {
  color: #f6edf7;
  border: 1px solid rgb(210 167 255 / 30%);
  background: rgb(18 15 23 / 48%);
  backdrop-filter: blur(0.4rem);
}

.story-finale.template-midnight-cinema .final-sparkle {
  color: #d2a7ff;
}

.story-greeting.template-botanical-journal .photo-sticker,
.story-detail.template-botanical-journal .photo-sticker,
.story-finale.template-botanical-journal .final-copy {
  color: #263322;
  background: #dce5c8;
}

.story-greeting.template-botanical-journal .greeting-photo,
.story-detail.template-botanical-journal .detail-photo,
.story-finale.template-botanical-journal .final-photo {
  border: 0.55rem solid #f8f4e8;
  box-shadow: 0 1rem 2rem rgb(38 51 34 / 15%);
}

.story-detail.template-botanical-journal .detail-copy {
  border-left: 1px solid rgb(83 104 75 / 32%);
  padding-left: clamp(1rem, 4vw, 3rem);
}

.story-greeting.template-botanical-journal .eyebrow,
.story-detail.template-botanical-journal .eyebrow,
.story-finale.template-botanical-journal .eyebrow {
  color: #53684b;
}

.story-finale.template-botanical-journal .final-sparkle {
  color: #53684b;
}

.story-greeting.template-love-letter .greeting-text,
.story-detail.template-love-letter .detail-copy h2,
.story-finale.template-love-letter .final-message {
  color: #49362f;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.035em;
}

.story-detail.template-love-letter .detail-photo,
.story-finale.template-love-letter .final-photo {
  border: 0.65rem solid #fff9ee;
  border-bottom-width: 3rem;
  border-radius: 0.15rem;
  padding: 0.3rem;
  background: #fff9ee;
  box-shadow: 0 1.2rem 2.8rem rgb(63 45 38 / 18%);
}

.story-detail.template-love-letter .detail-copy > p:last-child {
  color: rgb(52 41 35 / 76%);
}

.story-greeting.template-love-letter .eyebrow,
.story-detail.template-love-letter .eyebrow,
.story-finale.template-love-letter .eyebrow {
  color: var(--letter-accent);
}

.story-finale.template-love-letter .final-copy {
  border: 1px solid rgb(153 93 80 / 20%);
  border-radius: 0.15rem;
  background: #fff9ee;
  box-shadow: 0 1.2rem 2.8rem rgb(63 45 38 / 14%);
}

.story-finale.template-love-letter .final-signature {
  color: var(--letter-accent);
  font-family: 'Instrument Serif', serif;
  font-size: 1.1rem;
  font-style: italic;
}

.story-finale.template-love-letter .final-sparkle {
  color: var(--letter-accent);
}

.story-finale.template-midnight-cinema .final-message,
.story-finale.template-midnight-cinema .final-signature {
  color: #f6edf7;
  text-shadow: 0 1px 1.25rem rgb(0 0 0 / 55%);
}

.story-greeting.template-memory-atlas .greeting-text {
  color: var(--atlas-ink);
  font-size: clamp(2rem, 4vw, 4.3rem);
}

.story-greeting.template-memory-atlas .eyebrow,
.story-detail.template-memory-atlas .eyebrow,
.story-finale.template-memory-atlas .eyebrow {
  color: var(--atlas-accent);
}

.story-greeting.template-memory-atlas .greeting-photo,
.story-detail.template-memory-atlas .detail-photo {
  min-height: 22rem;
  border: 0.45rem solid #fffdf7;
  background: #fffdf7;
  box-shadow: 0 0.8rem 1.8rem rgb(37 57 67 / 15%);
}

.story-greeting.template-memory-atlas .greeting-photo img,
.story-detail.template-memory-atlas .detail-photo img {
  border-radius: 0;
}

.story-greeting.template-memory-atlas .photo-sticker,
.story-detail.template-memory-atlas .photo-sticker {
  color: #f6f1e5;
  background: var(--atlas-accent);
  transform: none;
}

.story-detail.template-memory-atlas .detail-copy h2 {
  font-size: clamp(2.5rem, 5vw, 5rem);
}

.story-detail.template-memory-atlas .detail-copy > p:last-child {
  color: rgb(37 57 67 / 76%);
}

.story-finale.template-memory-atlas .final-photo {
  width: min(100%, 32rem);
  height: min(58svh, 36rem);
  border: 0.55rem solid #f6f1e5;
  border-radius: 0.15rem;
  padding: 0.35rem;
  background: #f6f1e5;
  transform: none;
}

.story-finale.template-memory-atlas .final-copy {
  border: 1px solid rgb(37 57 67 / 15%);
  border-radius: 0.2rem;
  color: var(--atlas-ink);
  background: #f6f1e5;
}

.story-finale.template-memory-atlas .final-message {
  font-size: clamp(2.2rem, 5vw, 4.8rem);
}

.story-finale.template-memory-atlas .final-signature {
  color: var(--atlas-accent);
}

.story-finale.template-memory-atlas .final-sparkle {
  color: var(--atlas-accent);
}

@media (max-width: 700px) {
  .greeting-copy {
    padding: 0.8rem 0.5rem;
  }

  .greeting-text {
    margin-top: 0.55rem;
    font-size: clamp(1.75rem, 7vw, 3.5rem);
  }

  .detail-photo {
    height: min(64svh, 34rem);
    align-self: center;
  }

  .detail-copy {
    padding: 0.4rem;
  }

  .detail-copy h2 {
    font-size: clamp(1.6rem, 7vw, 3.3rem);
  }

  .detail-copy > p:last-child {
    font-size: clamp(0.68rem, 2.6vw, 0.9rem);
    line-height: 1.5;
  }

  .final-photo {
    width: 100%;
    height: min(57svh, 29rem);
    border-bottom-width: 2.5rem;
  }

  .final-copy {
    padding: clamp(0.85rem, 3.5vw, 1.35rem);
  }

  .final-message {
    font-size: clamp(1.65rem, 7.3vw, 3rem);
  }

  .final-sparkle {
    right: 1%;
    bottom: 2%;
    font-size: 3.5rem;
  }

  .story-greeting.template-memory-atlas .greeting-photo,
  .story-detail.template-memory-atlas .detail-photo {
    min-height: 15rem;
    height: 36svh;
  }

  .story-finale.template-memory-atlas .final-photo {
    height: 36svh;
  }
}

@media (max-width: 360px) {
  .eyebrow {
    font-size: 0.52rem;
  }

  .detail-copy h2 {
    font-size: 1.45rem;
  }

  .final-copy {
    padding: 0.75rem;
  }

  .final-message {
    font-size: 1.5rem;
  }
}

@media (max-height: 600px) {
  .detail-photo,
  .final-photo {
    height: 56svh;
  }
}

@media (max-width: 600px) {
  .story-detail .detail-photo,
  .story-finale .final-photo {
    width: min(100%, 28rem);
    height: clamp(13rem, 34svh, 22rem);
    justify-self: center;
  }

  .story-detail .detail-copy,
  .story-finale .final-copy {
    width: min(100%, 42rem);
    margin-inline: auto;
    padding: 0.5rem clamp(0.25rem, 2vw, 0.75rem);
  }

  .story-detail .detail-copy h2 {
    margin-block: 0.5rem;
    font-size: clamp(1.55rem, 8vw, 3rem);
  }

  .story-detail .detail-copy > p:last-child {
    font-size: clamp(0.9rem, 3.8vw, 1.05rem);
    line-height: 1.6;
  }

  .story-finale .final-copy {
    padding: clamp(1rem, 4vw, 1.35rem);
  }

  .story-finale .final-message {
    font-size: clamp(1.65rem, 8vw, 3rem);
    line-height: 1.05;
  }

  .story-detail.template-memory-atlas .detail-copy h2 {
    font-size: clamp(1.55rem, 8vw, 3rem);
  }
}

@media (min-width: 901px) and (max-height: 820px) {
  .detail-photo {
    height: min(60svh, 38rem);
  }

  .final-photo {
    height: min(58svh, 36rem);
  }
}

.story-greeting[data-section-variant='film-scene'] .greeting-photo {
  border-radius: 0.2rem;
  transform: rotate(0);
}

.story-greeting[data-section-variant='journal-entry'] .greeting-photo {
  border-radius: 0.25rem;
  transform: rotate(-1deg);
}

.story-detail[data-section-variant='map-pin'] .detail-photo {
  border-radius: 50% 50% 0.35rem 0.35rem;
}

.story-detail[data-section-variant='cinematic'] .detail-photo {
  border-radius: 0.2rem;
  transform: rotate(0);
}

.story-finale[data-section-variant='credits'] .final-copy {
  text-align: center;
}

.story-finale[data-section-variant='sealed-note'] .final-message {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
}
</style>
