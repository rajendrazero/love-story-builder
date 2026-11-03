<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StorySectionConfig } from '#shared/story-sections'

const props = defineProps<{
  story: StoryContent
  config: StorySectionConfig
}>()
const templateId = computed(() => props.story.templateId ?? 'editorial-rose')
const clock = shallowRef(Date.now())
let clockTimer: ReturnType<typeof setInterval> | undefined
const countdownTarget = computed(() => {
  const date = props.story.sectionContent?.countdown?.targetDate
  return date ? Date.parse(`${date}T00:00:00.000Z`) : Number.NaN
})
const countdownDays = computed(() => Number.isFinite(countdownTarget.value)
  ? Math.max(0, Math.ceil((countdownTarget.value - clock.value) / 86_400_000))
  : 0)
const formattedCountdownDate = computed(() => formatDate(props.story.sectionContent?.countdown?.targetDate))

onMounted(() => {
  if (props.config.type !== 'countdown') return
  clock.value = Date.now()
  clockTimer = setInterval(() => {
    clock.value = Date.now()
  }, 60_000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})

function formatDate(value: string | undefined): string {
  if (!value) return ''
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`))
}
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
      <template v-if="config.type === 'love-notes'">
        <header class="creative-heading">
          <p class="creative-eyebrow">Dibaca kapan saja</p>
          <h2>Catatan kecil untukmu.</h2>
        </header>
        <div class="love-note-list">
          <article v-for="(note, index) in story.sectionContent?.loveNotes ?? []" :key="`${index}-${note}`" class="love-note">
            <span aria-hidden="true">♡</span>
            <p>{{ note }}</p>
          </article>
        </div>
      </template>
      <template v-else-if="config.type === 'distance-map'">
        <header class="creative-heading">
          <p class="creative-eyebrow">Jarak hanyalah satu garis</p>
          <h2>{{ story.sectionContent?.distanceMap?.note || 'Selalu menemukan jalan pulang.' }}</h2>
        </header>
        <div class="distance-route">
          <div class="distance-stop"><span aria-hidden="true">●</span><p>{{ story.sectionContent?.distanceMap?.origin }}</p></div>
          <span class="distance-line" aria-hidden="true">✦ ─ ─ ─ ─ ✦</span>
          <div class="distance-stop"><span aria-hidden="true">●</span><p>{{ story.sectionContent?.distanceMap?.destination }}</p></div>
        </div>
      </template>
      <template v-else-if="config.type === 'future-dreams'">
        <header class="creative-heading">
          <p class="creative-eyebrow">Masih banyak halaman di depan</p>
          <h2>Hal-hal yang ingin kita lakukan.</h2>
        </header>
        <ul class="dream-list">
          <li v-for="(dream, index) in story.sectionContent?.futureDreams ?? []" :key="`${index}-${dream}`">
            <span>{{ String(index + 1).padStart(2, '0') }}</span>{{ dream }}
          </li>
        </ul>
      </template>
      <div v-else class="countdown-content">
        <p class="creative-eyebrow">Simpan tanggal ini</p>
        <h2>{{ story.sectionContent?.countdown?.title }}</h2>
        <p class="countdown-days">{{ countdownDays }}</p>
        <p>hari menuju hari spesial berikutnya</p>
        <time :datetime="story.sectionContent?.countdown?.targetDate">
          {{ formattedCountdownDate }}
        </time>
      </div>
    </div>
  </section>
</template>

<style scoped>
.story-creative-section {
  display: grid;
  align-items: center;
  padding-inline: var(--screen-pad);
  background: #f7f4ed;
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

.creative-heading h2,
.countdown-content h2 {
  margin: 0.6rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2rem, 5vw, 4.5rem);
  font-weight: 400;
  line-height: 0.98;
}

.creative-heading > p:last-child {
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

.creative-love-notes {
  background: #f7f4ed;
}

.love-note-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}

.love-note {
  min-height: 12rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: #fffaf5;
  box-shadow: 0 1rem 2rem rgb(32 29 40 / 6%);
}

.love-note span {
  color: #9c6257;
  font-size: 1.5rem;
}

.love-note p {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.2rem, 2vw, 1.65rem);
  line-height: 1.35;
}

.creative-distance-map {
  background: #dcefe1;
}

.distance-route {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(0.75rem, 4vw, 3rem);
  max-width: 60rem;
  margin: 4rem auto 0;
}

.distance-stop {
  display: grid;
  justify-items: center;
  gap: 0.8rem;
  text-align: center;
}

.distance-stop > span {
  color: #53684b;
  font-size: 2rem;
}

.distance-stop p {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.2rem, 2.8vw, 2.25rem);
}

.distance-line {
  color: #9c6257;
  font-size: clamp(0.85rem, 2vw, 1.4rem);
  white-space: nowrap;
}

.creative-distance-map[data-section-variant='coordinates'] .distance-stop p {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(0.85rem, 2vw, 1.15rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.creative-future-dreams {
  background: #d8f36a;
}

.dream-list {
  display: grid;
  max-width: 56rem;
  gap: 0;
  margin: 0 auto;
  padding: 0;
  list-style: none;
}

.dream-list li {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  border-bottom: 1px solid rgb(32 29 40 / 24%);
  padding: 1rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.4rem, 3vw, 2.6rem);
}

.dream-list li span {
  color: #5045f5;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.68rem;
}

.creative-future-dreams[data-section-variant='horizon'] .dream-list li {
  padding-block: 1.4rem;
}

.creative-countdown {
  background: #ff7968;
  text-align: center;
}

.countdown-content h2 {
  max-width: 16ch;
  margin-inline: auto;
}

.countdown-days {
  margin: 1rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(4rem, 16vw, 11rem);
  font-weight: 700;
  letter-spacing: -0.08em;
  line-height: 0.9;
}

.countdown-content > p:not(.creative-eyebrow, .countdown-days) {
  margin: 0.8rem 0;
  color: rgb(32 29 40 / 70%);
}

.countdown-content time {
  display: inline-block;
  margin-top: 1.5rem;
  border: 1px solid rgb(32 29 40 / 45%);
  border-radius: 999px;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
}

.creative-countdown[data-section-variant='calendar'] .countdown-days {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
}

@media (max-width: 640px) {
  .distance-route {
    gap: 0.4rem;
  }

  .distance-line {
    font-size: 0.7rem;
  }
}
</style>
