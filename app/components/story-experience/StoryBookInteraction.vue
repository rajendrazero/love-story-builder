<template>
  <section
    class="story-screen story-book"
    :class="`template-${templateId}`"
    data-story-section="book"
    :data-section-variant="config.variant"
    :data-scroll-effect="config.animation.scroll"
  >
    <DecorativeLayer class="story-section-decorations" :template-id="templateId" scene="book" />
    <header class="book-heading">
      <p class="eyebrow">{{ bookCopy.eyebrow }}</p>
      <h2>{{ bookCopy.title }}</h2>
    </header>

    <div class="book-stage" :class="{ 'book-is-open': bookOpen }">
      <div class="book-spread">
        <article v-if="leftPage" class="book-page book-page-left">
          <img :src="leftPage.image" :alt="leftPage.title" loading="lazy">
          <div class="page-copy">
            <span>Bab {{ String(activePage).padStart(2, '0') }}</span>
            <h3>{{ leftPage.title }}</h3>
            <p>{{ leftPage.text }}</p>
          </div>
        </article>
        <div v-else class="book-page book-inside-cover">
          <span>SEBUAH CERITA KECIL</span>
          <strong>{{ story.coupleNames }}</strong>
          <span>ditulis dengan hati ♡</span>
        </div>

        <article v-if="rightPage" class="book-page book-page-right">
          <img :src="rightPage.image" :alt="rightPage.title" loading="lazy">
          <div class="page-copy">
            <span>Bab {{ String(activePage + 1).padStart(2, '0') }}</span>
            <h3>{{ rightPage.title }}</h3>
            <p>{{ rightPage.text }}</p>
          </div>
        </article>
      </div>

      <div v-if="isTurning && flipFrontPage" class="page-turn" :class="`page-turn-${turnDirection}`">
        <article class="page-turn-face page-turn-front">
          <img :src="flipFrontPage.image" :alt="flipFrontPage.title" aria-hidden="true">
          <div class="page-copy">
            <span>Bab {{ String(turnDirection === 'next' ? activePage : activePage + 2).padStart(2, '0') }}</span>
            <h3>{{ flipFrontPage.title }}</h3>
            <p>{{ flipFrontPage.text }}</p>
          </div>
        </article>
        <article v-if="flipBackPage" class="page-turn-face page-turn-back">
          <img :src="flipBackPage.image" :alt="flipBackPage.title" aria-hidden="true">
          <div class="page-copy">
            <span>Selamanya · {{ story.coupleNames }}</span>
            <h3>{{ flipBackPage.title }}</h3>
            <p>{{ flipBackPage.text }}</p>
          </div>
        </article>
      </div>

      <button
        v-if="showCover"
        type="button"
        class="book-cover"
        :class="{ 'book-cover-open': bookOpen }"
        :aria-label="bookOpen ? 'Menutup sampul buku' : 'Membuka sampul buku'"
        @click="toggleBook"
        @transitionend.self="onCoverTransitionEnd"
      >
        <span class="cover-front">
          <span class="cover-ornament" aria-hidden="true">✳</span>
          <span class="cover-kicker">{{ bookCopy.coverKicker(story.date) }}</span>
          <strong>{{ story.coupleNames }}</strong>
          <span class="cover-title">{{ story.title }}</span>
          <span class="cover-date">{{ story.date }}</span>
        </span>
        <span class="cover-inside" aria-hidden="true">{{ bookCopy.coverInside }}</span>
      </button>
      <span class="book-spine" aria-hidden="true" />
    </div>

    <div class="book-controls">
      <button
        v-if="!bookOpen"
        type="button"
        class="book-control book-open-control"
        @click="toggleBook"
      >
        Buka buku <span aria-hidden="true">↗</span>
      </button>
      <template v-else>
        <button
          v-if="activePage > 0"
          type="button"
          class="book-control"
          :disabled="isTurning"
          @click="turnPage('previous')"
        >
          ← Sebelumnya
        </button>
        <button
          v-else
          type="button"
          class="book-control book-close-control"
          @click="toggleBook"
        >
          Tutup
        </button>
        <span class="page-counter">Bab {{ activePage + 1 }} / {{ story.storyPages.length }}</span>
        <button
          type="button"
          class="book-control"
          :disabled="activePage >= story.storyPages.length - 1 || isTurning"
          @click="turnPage('next')"
        >
          Selanjutnya →
        </button>
        <button
          v-if="activePage > 0"
          type="button"
          class="book-close-control"
          @click="toggleBook"
        >
          Tutup
        </button>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StoryTemplateId } from '#shared/story-templates'
import type { StorySectionConfig } from '#shared/story-sections'
import { getStoryPageTurn, getStoryPageTurnDuration } from '~/composables/story/story-book'
import DecorativeLayer from './DecorativeLayer.vue'

type StoryPage = StoryContent['storyPages'][number]
type BookCopy = {
  eyebrow: string
  title: string
  coverKicker: (date: string) => string
  coverInside: string
}

const props = defineProps<{ story: StoryContent, config: StorySectionConfig }>()
const templateId = computed(() => props.story.templateId ?? 'editorial-rose')
const bookCopyByTemplate: Record<StoryTemplateId, BookCopy> = {
  'editorial-rose': {
    eyebrow: 'the lore, in chapters',
    title: 'Buku kecil tentang kita',
    coverKicker: () => 'OUR LITTLE STORY',
    coverInside: 'Untuk kita, selalu ♡',
  },
  'midnight-cinema': {
    eyebrow: 'the story · scene by scene',
    title: 'Film yang terus kita pilih.',
    coverKicker: () => 'A FILM ABOUT US',
    coverInside: 'Fade in, us ♡',
  },
  'botanical-journal': {
    eyebrow: 'catatan perjalanan · bab demi bab',
    title: 'Jurnal kecil tentang kita.',
    coverKicker: date => `FIELD NOTES · ${date}`,
    coverInside: 'tumbuh, hari demi hari ♡',
  },
  'love-letter': {
    eyebrow: 'surat yang selalu ingin kubaca',
    title: 'Satu cerita, banyak halaman.',
    coverKicker: () => 'SURAT KECIL UNTUKMU',
    coverInside: 'Dengan cinta, selalu ♡',
  },
  'memory-atlas': {
    eyebrow: 'rute kenangan · dari awal hingga kini',
    title: 'Peta kecil perjalanan kita.',
    coverKicker: date => `ATLAS KENANGAN · ${date}`,
    coverInside: 'Untuk kita, selalu ♡',
  },
}
const bookCopy = computed(() => bookCopyByTemplate[templateId.value])
const bookOpen = ref(false)
const showCover = ref(true)
const activePage = ref(0)
const isTurning = ref(false)
const turnDirection = ref<'next' | 'previous'>('next')
const flipFrontPage = ref<StoryPage | null>(null)
const flipBackPage = ref<StoryPage | null>(null)
const leftPage = computed(() => props.story.storyPages[activePage.value - 1] ?? null)
const rightPage = computed(() => props.story.storyPages[activePage.value] ?? null)
let turnTimer: ReturnType<typeof setTimeout> | undefined
let closeCoverFrame: number | undefined

async function toggleBook(): Promise<void> {
  if (!bookOpen.value) {
    bookOpen.value = true
    return
  }

  showCover.value = true
  await nextTick()
  closeCoverFrame = requestAnimationFrame(() => {
    bookOpen.value = false
    closeCoverFrame = undefined
  })
}

function onCoverTransitionEnd(event: TransitionEvent): void {
  if (event.propertyName === 'transform' && bookOpen.value) {
    showCover.value = false
  }
}

function turnPage(direction: 'next' | 'previous'): void {
  if (isTurning.value) return

  const turn = getStoryPageTurn(props.story.storyPages, activePage.value, direction)
  if (!turn) return

  turnDirection.value = direction
  flipFrontPage.value = turn.page
  flipBackPage.value = turn.page
  isTurning.value = true
  activePage.value = turn.nextIndex

  if (turnTimer) clearTimeout(turnTimer)
  turnTimer = setTimeout(() => {
    isTurning.value = false
    turnTimer = undefined
  }, getStoryPageTurnDuration(window.matchMedia('(prefers-reduced-motion: reduce)').matches))
}

onBeforeUnmount(() => {
  if (turnTimer) clearTimeout(turnTimer)
  if (closeCoverFrame !== undefined) cancelAnimationFrame(closeCoverFrame)
})
</script>

<style scoped>
.story-book {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  color: #fffaf5;
  background-color: #201d28;
  background-image: radial-gradient(ellipse at 50% 70%, rgb(80 69 245 / 32%), transparent 58%);
}

.book-heading {
  width: 100%;
  text-align: center;
}

.book-heading h2 {
  margin: 0.3rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.7rem, 4vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.96;
}

.book-heading .eyebrow {
  margin: 0;
  color: #d8f36a;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(0.58rem, 0.85vw, 0.76rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1.5;
  text-transform: uppercase;
}

.book-stage {
  position: relative;
  width: min(88vw, 64rem);
  height: min(58svh, 34rem);
  flex: 0 1 auto;
  perspective: 1800px;
  perspective-origin: 50% 45%;
}

.book-spread {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  border-radius: 0.55rem 0.9rem 0.9rem 0.55rem;
  background: #fffaf0;
  box-shadow: 0 1.5rem 2rem rgb(0 0 0 / 24%), inset 0 0 1.4rem rgb(70 43 23 / 18%);
}

.book-stage:not(.book-is-open) .book-spread { visibility: hidden; }

.book-spread::after {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  z-index: 3;
  width: 1.1rem;
  background: linear-gradient(90deg, rgb(41 29 22 / 18%), rgb(255 250 240 / 75%), rgb(41 29 22 / 12%));
  content: '';
  pointer-events: none;
  transform: translateX(-50%);
}

.book-page {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  color: #201d28;
  background: linear-gradient(100deg, #fffdf6, #f8f0df);
}

.book-page-left { border-right: 1px solid rgb(50 34 22 / 8%); }

.book-page img,
.page-turn-face img {
  width: 100%;
  height: 40%;
  min-height: 0;
  flex: 0 0 40%;
  object-fit: cover;
}

.page-copy {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  padding: clamp(0.55rem, 2vw, 1.5rem);
}

.page-copy > span {
  color: #5045f5;
  font-size: clamp(0.48rem, 0.8vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-copy h3 {
  display: -webkit-box;
  overflow: hidden;
  margin: 0.35rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 2.25vw, 2.2rem);
  font-weight: 400;
  line-height: 1;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.page-copy p {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: rgb(32 29 40 / 72%);
  font-size: clamp(0.55rem, 1vw, 0.85rem);
  line-height: 1.5;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
}

.book-inside-cover {
  align-items: center;
  justify-content: center;
  gap: clamp(0.4rem, 2vw, 1.5rem);
  padding: 1rem;
  text-align: center;
}

.book-inside-cover span {
  color: #5045f5;
  font-size: clamp(0.48rem, 0.85vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.12em;
}

.book-inside-cover strong {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.4rem, 3vw, 3rem);
  font-weight: 400;
}

.book-spine {
  position: absolute;
  inset-block: 0;
  left: 50%;
  z-index: 5;
  width: 0.65rem;
  background: linear-gradient(90deg, rgb(59 39 28 / 24%), rgb(255 246 225 / 55%), rgb(59 39 28 / 18%));
  pointer-events: none;
  transform: translateX(-50%);
}

.book-cover {
  position: absolute;
  top: 0;
  left: 25%;
  z-index: 7;
  display: block;
  width: 50%;
  height: 100%;
  border: 0;
  border-radius: 0.45rem 0.8rem 0.8rem 0.45rem;
  padding: 0;
  color: #fffaf5;
  background: #5045f5;
  box-shadow: inset 0.5rem 0 1rem rgb(0 0 0 / 16%), 0.45rem 0 0 #382fc0;
  cursor: pointer;
  transform: rotateY(0);
  transform-origin: left center;
  transform-style: preserve-3d;
  transition: transform 850ms cubic-bezier(0.2, 0.74, 0.2, 1);
}

.book-cover-open {
  pointer-events: none;
  transform: rotateY(-165deg);
}

.cover-front,
.cover-inside {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backface-visibility: hidden;
  text-align: center;
}

.cover-front {
  gap: clamp(0.35rem, 2svh, 1rem);
  border: 1px solid rgb(255 255 255 / 32%);
  border-radius: inherit;
  padding: 1rem;
  background:
    radial-gradient(ellipse at 50% 45%, rgb(139 129 255 / 55%), transparent 56%),
    linear-gradient(135deg, #5147e5, #282174);
  box-shadow: inset 0.35rem 0 1rem rgb(0 0 0 / 16%), inset 0 0 0 0.45rem rgb(255 255 255 / 10%);
}

.cover-ornament {
  color: #d8f36a;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2.2rem, 6vw, 5rem);
}

.cover-kicker,
.cover-date {
  font-size: clamp(0.48rem, 0.9vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.cover-front strong {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.5rem, 4.6vw, 4rem);
  font-weight: 400;
  line-height: 1;
  overflow-wrap: anywhere;
}

.cover-title {
  max-width: 22ch;
  color: #d8f36a;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(0.9rem, 2vw, 1.5rem);
  font-style: italic;
  line-height: 1.1;
}

.cover-inside {
  border: 1px solid rgb(255 255 255 / 25%);
  background: #b7a56d;
  color: #201d28;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 2vw, 1.5rem);
  transform: rotateY(180deg);
}

.page-turn {
  position: absolute;
  top: 0;
  z-index: 6;
  width: 50%;
  height: 100%;
  transform-style: preserve-3d;
  pointer-events: none;
}

.page-turn-next {
  right: 0;
  transform-origin: left center;
  animation: turn-next 780ms cubic-bezier(0.35, 0.02, 0.4, 1) forwards;
}

.page-turn-previous {
  left: 0;
  transform-origin: right center;
  animation: turn-previous 780ms cubic-bezier(0.35, 0.02, 0.4, 1) forwards;
}

.page-turn-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(50 34 22 / 10%);
  color: #201d28;
  background: #fffaf0;
  backface-visibility: hidden;
  box-shadow: 0 0 1rem rgb(40 29 22 / 18%);
}

.page-turn-back { transform: rotateY(180deg); }

.book-controls {
  display: flex;
  width: min(88vw, 64rem);
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  gap: clamp(0.35rem, 2vw, 1.5rem);
  color: rgb(255 250 245 / 76%);
}

.book-control,
.book-open-control,
.book-close-control {
  border: 1px solid rgb(255 250 245 / 35%);
  border-radius: 999px;
  padding: 0.65rem clamp(0.65rem, 2vw, 1rem);
  color: white;
  background: rgb(255 255 255 / 6%);
  font-size: clamp(0.62rem, 1vw, 0.78rem);
  white-space: nowrap;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease;
}

.book-control:hover:not(:disabled),
.book-open-control:hover,
.book-close-control:hover {
  color: #201d28;
  background: #d8f36a;
}

.book-control:disabled { cursor: not-allowed; opacity: 0.4; }
.book-open-control { border-color: #d8f36a; color: #201d28; background: #d8f36a; font-weight: 700; }
.book-close-control { border-color: transparent; background: transparent; }

.page-counter {
  min-width: max-content;
  font-size: clamp(0.55rem, 0.9vw, 0.7rem);
  letter-spacing: 0.08em;
}

.story-book.template-editorial-rose {
  background:
    radial-gradient(ellipse at 15% 50%, rgb(255 250 245 / 55%), transparent 45%),
    #f2d9d4;
}
.story-book.template-editorial-rose .book-heading .eyebrow { color: #f4c7b9; }
.story-book.template-editorial-rose .book-cover {
  background: #9c6257;
  box-shadow: inset 0.5rem 0 1rem rgb(0 0 0 / 16%), 0.45rem 0 0 #704249;
}
.story-book.template-editorial-rose .cover-front {
  background:
    radial-gradient(ellipse at 50% 45%, rgb(255 250 245 / 22%), transparent 56%),
    linear-gradient(135deg, #b97870, #704249);
}
.story-book.template-editorial-rose .cover-ornament,
.story-book.template-editorial-rose .cover-title { color: #f4c7b9; }
.story-book.template-editorial-rose .book-open-control { background: #f2d9d4; }

.story-book.template-midnight-cinema {
  color: #f6edf7;
  background-color: #120f17;
  background-image: radial-gradient(ellipse at 50% 70%, rgb(150 105 183 / 30%), transparent 58%);
}
.story-book.template-midnight-cinema .book-heading .eyebrow { color: #d2a7ff; }
.story-book.template-midnight-cinema .book-page { color: #211b29; }
.story-book.template-midnight-cinema .book-cover {
  border-radius: 0.15rem;
  background: #342541;
  box-shadow: inset 0.5rem 0 1rem rgb(0 0 0 / 30%), 0.45rem 0 0 #17131d;
}
.story-book.template-midnight-cinema .cover-front {
  border-color: rgb(210 167 255 / 42%);
  background:
    linear-gradient(0deg, rgb(18 15 23 / 68%), transparent),
    radial-gradient(ellipse at 50% 30%, rgb(150 105 183 / 45%), transparent 58%),
    #211a29;
}
.story-book.template-midnight-cinema .cover-ornament,
.story-book.template-midnight-cinema .cover-title { color: #d2a7ff; }
.story-book.template-midnight-cinema .book-open-control { color: #211b29; background: #d2a7ff; }

.story-book.template-botanical-journal {
  background:
    radial-gradient(ellipse at 50% 100%, rgb(83 104 75 / 14%), transparent 58%),
    #e7dcc1;
}
.story-book.template-botanical-journal .book-heading .eyebrow { color: #dce5c8; }
.story-book.template-botanical-journal .book-page,
.story-book.template-botanical-journal .book-inside-cover {
  background:
    repeating-linear-gradient(0deg, transparent 0 1.8rem, rgb(83 104 75 / 10%) 1.8rem 1.85rem),
    #f8f4e8;
}
.story-book.template-botanical-journal .book-cover {
  border-radius: 0.15rem;
  background: #53684b;
  box-shadow: inset 0.5rem 0 1rem rgb(0 0 0 / 18%), 0.45rem 0 0 #354731;
}
.story-book.template-botanical-journal .cover-front {
  border-color: rgb(248 244 232 / 70%);
  background:
    repeating-linear-gradient(0deg, transparent 0 2rem, rgb(248 244 232 / 8%) 2rem 2.05rem),
    linear-gradient(135deg, #697d5a, #354731);
}
.story-book.template-botanical-journal .cover-ornament,
.story-book.template-botanical-journal .cover-title { color: #dce5c8; }
.story-book.template-botanical-journal .book-open-control { color: #263322; background: #dce5c8; }

.story-book.template-love-letter {
  color: #49362f;
  background:
    radial-gradient(ellipse at 50% 100%, rgb(153 93 80 / 13%), transparent 58%),
    #ead7bd;
}
.story-book.template-love-letter .book-heading .eyebrow { color: #70463d; }
.story-book.template-love-letter .book-page,
.story-book.template-love-letter .book-inside-cover {
  background:
    repeating-linear-gradient(0deg, transparent 0 1.8rem, rgb(153 93 80 / 9%) 1.8rem 1.85rem),
    #fff9ee;
}
.story-book.template-love-letter .book-page img,
.story-book.template-love-letter .page-turn-face img { border-radius: 0; }
.story-book.template-love-letter .page-copy > span,
.story-book.template-love-letter .book-inside-cover span { color: var(--letter-accent); }
.story-book.template-love-letter .book-cover {
  border-radius: 0.15rem 0.55rem 0.55rem 0.15rem;
  background: var(--letter-accent);
  box-shadow: inset 0.5rem 0 1rem rgb(0 0 0 / 16%), 0.45rem 0 0 #74453e;
}
.story-book.template-love-letter .cover-front {
  border-color: rgb(255 249 238 / 65%);
  background:
    repeating-linear-gradient(0deg, transparent 0 2rem, rgb(255 249 238 / 8%) 2rem 2.05rem),
    linear-gradient(135deg, #ae7060, #75463e);
}
.story-book.template-love-letter .cover-ornament,
.story-book.template-love-letter .cover-title { color: #f5e8d5; }
.story-book.template-love-letter .book-open-control { color: #fffaf5; background: var(--letter-accent); }

.story-book.template-memory-atlas {
  min-height: 48rem;
  background:
    radial-gradient(ellipse at 50% 70%, rgb(120 156 165 / 24%), transparent 58%),
    #263c49;
}
.story-book.template-memory-atlas,
.story-book.template-memory-atlas .book-heading h2 { color: #f6f1e5; }
.story-book.template-memory-atlas .book-heading h2 {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.035em;
}
.story-book.template-memory-atlas .book-heading .eyebrow { color: #c7d8d1; }
.story-book.template-memory-atlas .book-stage { height: min(52svh, 31rem); }
.story-book.template-memory-atlas .book-cover { background: #35596b; }
.story-book.template-memory-atlas .cover-front {
  background:
    repeating-linear-gradient(135deg, transparent 0 1.8rem, rgb(255 255 255 / 6%) 1.8rem 1.85rem),
    linear-gradient(145deg, #446d7d, #263c49);
}
.story-book.template-memory-atlas .cover-ornament,
.story-book.template-memory-atlas .cover-title { color: #d3ddc2; }
.story-book.template-memory-atlas .book-open-control { color: #253943; background: #d3ddc2; }

@media (max-width: 700px) {
  .book-heading h2 { font-size: clamp(1.6rem, 7vw, 2.6rem); }
  .story-book { padding-top: 4.5rem; padding-bottom: 1rem; }
  .book-stage { width: 91vw; height: min(58svh, 32rem); }
  .book-spread { grid-template-columns: 1fr; }
  .book-spread::after { left: 0.45rem; width: 0.45rem; }
  .book-page-left { display: none; }
  .book-page-right { margin-left: 0.45rem; }
  .book-page img,
  .page-turn-face img { height: 43%; flex-basis: 43%; }
  .page-copy { padding: clamp(0.7rem, 4vw, 1.2rem); }
  .page-copy > span { font-size: clamp(0.56rem, 2.4vw, 0.72rem); }
  .page-copy h3 { margin-block: 0.45rem; font-size: clamp(1.2rem, 5vw, 2rem); }
  .page-copy p { font-size: clamp(0.7rem, 2.8vw, 0.95rem); line-height: 1.55; -webkit-line-clamp: 5; }
  .book-cover { left: 0; width: 100%; }
  .book-spine { left: 0.4rem; z-index: 8; width: 0.5rem; transform: none; }
  .cover-front strong { font-size: clamp(2rem, 9vw, 3.3rem); }
  .page-turn { width: calc(100% - 0.45rem); left: 0.45rem; right: auto; transform-origin: left center; }
  .page-turn-previous { animation-name: turn-next; }
  .book-controls { width: 100%; gap: 0.35rem; }
  .book-control,
  .book-open-control,
  .book-close-control { padding: 0.6rem 0.65rem; }
  .story-book.template-memory-atlas { min-height: 38rem; }
}

@media (max-width: 360px) {
  .book-controls { gap: 0.2rem; }
  .book-control,
  .book-open-control,
  .book-close-control { padding-inline: 0.45rem; font-size: 0.58rem; }
  .page-counter { font-size: 0.5rem; }
}

@media (max-height: 600px) {
  .book-stage { height: 54svh; }
}

@media (min-width: 901px) and (max-height: 820px) {
  .story-book { padding-top: 4rem; padding-bottom: 1rem; }
  .book-stage { width: min(72vw, 56rem); height: min(50svh, 29rem); }
  .cover-front { gap: clamp(0.3rem, 1.4svh, 0.7rem); padding: 0.75rem; }
  .cover-ornament { font-size: clamp(2rem, 5vw, 3.8rem); }
  .cover-front strong { font-size: clamp(1.55rem, 3.5vw, 3rem); }
  .cover-title { font-size: clamp(0.85rem, 1.7vw, 1.25rem); }
}

@media (prefers-reduced-motion: reduce) {
  .book-cover { transition-duration: 1ms; }
  .page-turn-next,
  .page-turn-previous { animation-duration: 1ms; }
}

@keyframes turn-next {
  from { transform: rotateY(0); }
  to { transform: rotateY(-180deg); }
}

@keyframes turn-previous {
  from { transform: rotateY(0); }
  to { transform: rotateY(180deg); }
}
</style>
