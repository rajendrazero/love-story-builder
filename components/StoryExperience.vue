<template>
  <main
    ref="experience"
    class="story-experience bg-paper"
    :class="`template-${story.templateId ?? 'editorial-rose'}`"
  >
    <div v-if="demo" class="preview-bar">
      <NuxtLink to="/" class="preview-brand">selamanya<span>.</span></NuxtLink>
      <span class="preview-label">Pratinjau template · konten contoh</span>
      <NuxtLink :to="createTo" class="preview-link">Buat versiku ↗</NuxtLink>
    </div>

    <section class="story-screen story-hero">
      <div class="story-hero-copy">
        <p class="story-date">{{ story.date }}</p>
        <h1>{{ story.coupleNames }}</h1>
        <p class="story-title">{{ story.title }}</p>
        <p
          v-if="story.templateId === 'editorial-rose' && story.templateDetails?.editorialRose?.dedication"
          class="template-detail template-editorial-detail"
        >
          {{ story.templateDetails.editorialRose.dedication }}
        </p>
        <p
          v-else-if="story.templateId === 'midnight-cinema' && story.templateDetails?.midnightCinema?.openingQuote"
          class="template-detail template-cinema-detail"
        >
          “{{ story.templateDetails.midnightCinema.openingQuote }}”
        </p>
        <p
          v-else-if="story.templateId === 'botanical-journal' && story.templateDetails?.botanicalJournal?.journalLabel"
          class="template-detail template-botanical-detail"
        >
          {{ story.templateDetails.botanicalJournal.journalLabel }}
        </p>
        <button
          v-if="story.musicUrl"
          type="button"
          class="music-button"
          :aria-pressed="playing"
          @click="toggleMusic"
        >
          {{ playing ? 'Jeda lagu Ⅱ' : 'Putar lagu ♫' }}
        </button>
        <p v-if="musicError" class="music-error" role="status">{{ musicError }}</p>
      </div>
      <figure class="story-hero-photo">
        <img :src="story.heroImage" :alt="story.coupleNames">
        <figcaption>this is so us ♡</figcaption>
      </figure>
      <span class="hero-sparkle" aria-hidden="true">✳</span>
      <audio v-if="story.musicUrl" ref="audio" :src="story.musicUrl" loop />
    </section>

    <section class="story-screen story-greeting">
      <div class="greeting-copy">
        <p class="eyebrow">Untukmu, selalu ♡</p>
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
          :src="story.greetingVideoUrl"
          autoplay
          muted
          loop
          playsinline
          aria-label="Video kartu ucapan"
        />
        <img v-else :src="story.greetingImage" alt="Kartu ucapan">
        <span class="photo-sticker">one for the scrapbook ✳</span>
      </div>
    </section>

    <section ref="gallerySection" class="story-screen story-gallery">
      <header class="section-heading">
        <div>
          <p class="eyebrow">The camera roll, but make it forever</p>
          <h2>Kita, dalam bingkai.</h2>
        </div>
        <p class="gallery-hint">Geser untuk melihat →</p>
      </header>
      <div
        class="gallery-track"
        role="region"
        aria-label="Galeri foto kenangan"
        tabindex="0"
        @keydown.left.prevent="scrollGallery(-1)"
        @keydown.right.prevent="scrollGallery(1)"
      >
        <div
          v-for="(photo, index) in story.gallery"
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

    <section class="story-screen story-detail">
      <div class="detail-photo">
        <img :src="story.secondImage" :alt="story.coupleNames" loading="lazy">
        <span class="photo-sticker">my favorite person ♡</span>
      </div>
      <div class="detail-copy">
        <p class="eyebrow">{{ story.date }}</p>
        <h2>{{ story.detailTitle }}</h2>
        <p>{{ story.detailText }}</p>
      </div>
    </section>

    <section class="story-screen story-book">
      <header class="book-heading">
        <p class="eyebrow">the lore, in chapters</p>
        <h2>Buku kecil tentang kita</h2>
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
            <span class="cover-kicker">OUR LITTLE STORY</span>
            <strong>{{ story.coupleNames }}</strong>
            <span class="cover-title">{{ story.title }}</span>
            <span class="cover-date">{{ story.date }}</span>
          </span>
          <span class="cover-inside" aria-hidden="true">Untuk kita, selalu ♡</span>
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

    <section class="story-screen story-finale">
      <figure class="final-photo">
        <img :src="story.finalImage" alt="Foto kenangan terakhir" loading="lazy">
        <figcaption>keep this one forever ♡</figcaption>
      </figure>
      <div class="final-copy">
        <p class="eyebrow">sampai halaman terakhir ✳</p>
        <p class="final-message">{{ story.finalMessage }}</p>
        <p v-if="story.templateId === 'midnight-cinema' && story.templateDetails?.midnightCinema?.credits" class="final-signature">
          {{ story.templateDetails.midnightCinema.credits }}
        </p>
        <p v-else-if="story.templateId === 'editorial-rose' && story.templateDetails?.editorialRose?.signature" class="final-signature">
          {{ story.templateDetails.editorialRose.signature }}
        </p>
        <p v-else class="final-signature">{{ story.coupleNames }} · {{ story.date }}</p>
      </div>
      <span class="final-sparkle" aria-hidden="true">✳</span>
    </section>
    <footer class="story-footer">Disimpan di sini, <span>selamanya.</span></footer>
  </main>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { StoryContent } from '#shared/schema/story'

type StoryPage = StoryContent['storyPages'][number]
type TurnDirection = 'next' | 'previous'

const props = withDefaults(defineProps<{
  story: StoryContent
  demo?: boolean
  createTo?: string
}>(), {
  demo: false,
  createTo: '/templates',
})

const experience = ref<HTMLElement | null>(null)
const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const musicError = ref('')
const bookOpen = ref(false)
const showCover = ref(true)
const activePage = ref(0)
const isTurning = ref(false)
const turnDirection = ref<TurnDirection>('next')
const flipFrontPage = ref<StoryPage | null>(null)
const flipBackPage = ref<StoryPage | null>(null)
let motionMedia: gsap.MatchMedia | undefined
let turnTimer: ReturnType<typeof setTimeout> | undefined
const appCursorPreset = useState<NonNullable<StoryContent['cursorPreset']>>('story-cursor', () => 'ring')

watch(() => props.story.cursorPreset, (preset) => {
  appCursorPreset.value = preset ?? 'ring'
})

const leftPage = computed(() => props.story.storyPages[activePage.value - 1] ?? null)
const rightPage = computed(() => props.story.storyPages[activePage.value] ?? null)

function scrollGallery(direction: -1 | 1) {
  const track = experience.value?.querySelector<HTMLElement>('.gallery-track')
  if (!track) return
  track.scrollBy({ left: direction * track.clientWidth * 0.75, behavior: 'smooth' })
}

async function toggleMusic() {
  if (!audio.value) return
  if (playing.value) {
    audio.value.pause()
    playing.value = false
    musicError.value = ''
    return
  }
  try {
    await audio.value.play()
    playing.value = true
    musicError.value = ''
  } catch {
    playing.value = false
    musicError.value = 'Lagu tidak dapat diputar. Periksa tautan audio langsungnya.'
  }
}

async function toggleBook() {
  if (!bookOpen.value) {
    bookOpen.value = true
    return
  }

  showCover.value = true
  await nextTick()
  requestAnimationFrame(() => {
    bookOpen.value = false
  })
}

function onCoverTransitionEnd(event: TransitionEvent) {
  if (event.propertyName === 'transform' && bookOpen.value) {
    showCover.value = false
  }
}

function turnPage(direction: TurnDirection) {
  if (isTurning.value) return

  const nextIndex = activePage.value + (direction === 'next' ? 1 : -1)
  if (nextIndex < 0 || nextIndex >= props.story.storyPages.length) return

  turnDirection.value = direction
  flipFrontPage.value = direction === 'next'
    ? props.story.storyPages[activePage.value] ?? null
    : props.story.storyPages[activePage.value - 1] ?? null
  flipBackPage.value = flipFrontPage.value
  isTurning.value = true
  activePage.value = nextIndex

  if (turnTimer) clearTimeout(turnTimer)
  turnTimer = setTimeout(() => {
    isTurning.value = false
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 50 : 820)
}

onMounted(() => {
  appCursorPreset.value = props.story.cursorPreset ?? 'ring'
  const root = experience.value
  if (!root) return

  gsap.registerPlugin(ScrollTrigger)
  motionMedia = gsap.matchMedia(root)
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const revealGroups = [
      '.story-hero-copy, .story-hero-photo',
      '.greeting-copy, .greeting-photo',
      '.section-heading, .gallery-card',
      '.detail-photo, .detail-copy',
      '.book-heading, .book-stage, .book-controls',
      '.final-photo, .final-copy',
    ]

    root.querySelectorAll<HTMLElement>('.story-screen').forEach((section, index) => {
      const revealGroup = revealGroups[index]
      if (!revealGroup) return

      const targets = section.querySelectorAll<HTMLElement>(revealGroup)
      if (!targets.length) return

      gsap.from(targets, {
        y: 18,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 72%',
          once: true,
        },
      })
    })

    root.querySelectorAll<HTMLElement>(
      '.story-hero-photo img, .greeting-photo img, .greeting-photo video, .detail-photo img, .final-photo img',
    ).forEach((image) => {
      const section = image.closest<HTMLElement>('.story-screen')
      if (!section) return

      gsap.fromTo(image, {
        yPercent: 7,
        scale: 1.08,
      }, {
        yPercent: -7,
        scale: 1.02,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.7,
        },
      })
    })
  })
})

onBeforeUnmount(() => {
  appCursorPreset.value = 'ring'
  if (turnTimer) clearTimeout(turnTimer)
  motionMedia?.revert()
  audio.value?.pause()
})
</script>

<style scoped>
.story-experience {
  --screen-pad: clamp(1rem, 5vw, 5rem);
  overflow: clip;
  scroll-snap-type: y mandatory;
}

.preview-bar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 30;
  display: flex;
  height: 3rem;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--screen-pad);
  color: #fffaf5;
  background: rgb(32 29 40 / 92%);
  backdrop-filter: blur(14px);
}

.preview-brand {
  font-family: 'Instrument Serif', serif;
  font-size: 1.25rem;
  text-decoration: none;
}

.preview-brand span {
  color: #ff7968;
}

.preview-label {
  color: rgb(255 255 255 / 65%);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.preview-link {
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  color: #201d28;
  background: #f7f4ed;
  font-size: 0.72rem;
  text-decoration: none;
}

.story-screen {
  position: relative;
  display: grid;
  width: 100%;
  height: 100vh;
  height: 100svh;
  min-height: 0;
  overflow: hidden;
  padding: clamp(4.2rem, 9svh, 6.5rem) var(--screen-pad) clamp(1rem, 3svh, 2rem);
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.story-hero {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  align-items: center;
  background-color: #d8f36a;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.16'/%3E%3C/svg%3E");
}

.story-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 46rem;
}

.story-date,
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

.story-date {
  display: inline-flex;
  margin-bottom: clamp(0.8rem, 3svh, 1.6rem);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  color: white;
  background: #5045f5;
  transform: rotate(-2deg);
}

.story-hero h1 {
  max-width: 12ch;
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(2.6rem, 8.6vw, 8rem);
  font-weight: 700;
  letter-spacing: -0.075em;
  line-height: 0.86;
  overflow-wrap: anywhere;
}

.story-title {
  max-width: 18ch;
  margin: clamp(0.8rem, 2.4svh, 1.5rem) 0 0;
  color: #5045f5;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.7rem, 4vw, 3.8rem);
  font-style: italic;
  line-height: 1;
}

.music-button {
  margin-top: 1rem;
  border: 1px solid rgb(32 29 40 / 45%);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  background: transparent;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.music-error {
  margin: 0.5rem 0 0;
  font-size: 0.8rem;
}

.story-hero-photo {
  position: relative;
  z-index: 1;
  width: 100%;
  height: min(68svh, 44rem);
  margin: 0;
  border: clamp(0.35rem, 1vw, 0.7rem) solid white;
  border-radius: clamp(1rem, 3vw, 2rem);
  padding: 0.45rem 0.45rem 2.8rem;
  overflow: hidden;
  background: white;
  box-shadow: 0 2rem 5rem rgb(32 29 40 / 20%);
  transform: rotate(3deg);
}

.story-hero-photo img,
.greeting-photo img,
.greeting-photo video,
.detail-photo img,
.final-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-hero-photo img {
  border-radius: 1rem;
}

.story-hero-photo figcaption,
.final-photo figcaption {
  position: absolute;
  bottom: 0.48rem;
  left: 1rem;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-style: italic;
}

.hero-sparkle,
.final-sparkle {
  position: absolute;
  z-index: 2;
  color: #5045f5;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(4rem, 8vw, 8rem);
  pointer-events: none;
}

.hero-sparkle {
  top: 10%;
  right: 7%;
  transform: rotate(12deg);
}

.story-greeting {
  grid-template-columns: 0.75fr 1.25fr;
  align-items: stretch;
  padding-top: clamp(4.2rem, 9svh, 6.5rem);
  background: #ffcfbe;
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

.section-heading h2,
.book-heading h2 {
  margin: 0.3rem 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.7rem, 4vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 0.96;
}

.story-gallery .eyebrow,
.book-heading .eyebrow {
  color: #d8f36a;
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

.story-detail {
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(1rem, 5vw, 5rem);
  background: #dcefe1;
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

.book-stage:not(.book-is-open) .book-spread {
  visibility: hidden;
}

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

.book-page-left {
  border-right: 1px solid rgb(50 34 22 / 8%);
}

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

.page-turn-back {
  transform: rotateY(180deg);
}

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

.book-control:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.book-open-control {
  border-color: #d8f36a;
  color: #201d28;
  background: #d8f36a;
  font-weight: 700;
}

.book-close-control {
  border-color: transparent;
  background: transparent;
}

.page-counter {
  min-width: max-content;
  font-size: clamp(0.55rem, 0.9vw, 0.7rem);
  letter-spacing: 0.08em;
}

.story-finale {
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(1rem, 5vw, 5rem);
  background: #ff7968;
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
  bottom: 0.45rem;
  left: 1rem;
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
  right: 4%;
  bottom: 8%;
  color: #5045f5;
}

.story-footer {
  padding: 1.25rem;
  background: #f7f4ed;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-align: center;
  text-transform: uppercase;
}

.story-footer span {
  color: #5045f5;
}

@keyframes turn-next {
  from { transform: rotateY(0); }
  to { transform: rotateY(-180deg); }
}

@keyframes turn-previous {
  from { transform: rotateY(0); }
  to { transform: rotateY(180deg); }
}

@media (max-width: 700px) {
  .preview-label {
    display: none;
  }

  .story-screen {
    padding-inline: clamp(0.85rem, 4vw, 1.5rem);
  }

  .story-hero {
    grid-template-columns: 1fr;
    align-items: end;
    padding-bottom: 5svh;
  }

  .story-hero-copy {
    align-self: end;
    width: 68%;
    padding-bottom: 1svh;
  }

  .story-hero h1 {
    font-size: clamp(2.15rem, 11vw, 4.5rem);
  }

  .story-title {
    font-size: clamp(1.35rem, 6vw, 2.5rem);
  }

  .story-hero-photo {
    position: absolute;
    top: 15%;
    right: 5%;
    width: 53%;
    height: 55%;
    padding-bottom: 2.2rem;
  }

  .story-hero-photo figcaption {
    bottom: 0.3rem;
    left: 0.65rem;
  }

  .hero-sparkle {
    top: 8%;
    right: 6%;
  }

  .story-greeting {
    grid-template-columns: 1fr;
    grid-template-rows: 0.78fr 1.22fr;
    padding-top: 4.2rem;
  }

  .greeting-copy {
    padding: 0.8rem 0.5rem;
  }

  .greeting-text {
    margin-top: 0.55rem;
    font-size: clamp(1.75rem, 7vw, 3.5rem);
  }

  .section-heading {
    min-height: 3.5rem;
  }

  .section-heading h2,
  .book-heading h2 {
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

  .story-detail {
    grid-template-columns: 0.9fr 1.1fr;
    gap: 0.75rem;
    padding-block: 4.6rem 1rem;
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

  .story-book {
    padding-top: 4.5rem;
    padding-bottom: 1rem;
  }

  .book-stage {
    width: 91vw;
    height: min(58svh, 32rem);
  }

  .book-spread {
    grid-template-columns: 1fr;
  }

  .book-spread::after {
    left: 0.45rem;
    width: 0.45rem;
  }

  .book-page-left {
    display: none;
  }

  .book-page-right {
    margin-left: 0.45rem;
  }

  .book-page img,
  .page-turn-face img {
    height: 43%;
    flex-basis: 43%;
  }

  .page-copy {
    padding: clamp(0.7rem, 4vw, 1.2rem);
  }

  .page-copy > span {
    font-size: clamp(0.56rem, 2.4vw, 0.72rem);
  }

  .page-copy h3 {
    margin-block: 0.45rem;
    font-size: clamp(1.2rem, 5vw, 2rem);
  }

  .page-copy p {
    font-size: clamp(0.7rem, 2.8vw, 0.95rem);
    line-height: 1.55;
    -webkit-line-clamp: 5;
  }

  .book-cover {
    left: 0;
    width: 100%;
  }

  .book-spine {
    left: 0.4rem;
    z-index: 8;
    width: 0.5rem;
    transform: none;
  }

  .cover-front strong {
    font-size: clamp(2rem, 9vw, 3.3rem);
  }

  .page-turn {
    width: calc(100% - 0.45rem);
    left: 0.45rem;
    right: auto;
    transform-origin: left center;
  }

  .page-turn-previous {
    animation-name: turn-next;
  }

  .book-controls {
    width: 100%;
    gap: 0.35rem;
  }

  .book-control,
  .book-open-control,
  .book-close-control {
    padding: 0.6rem 0.65rem;
  }

  .story-finale {
    grid-template-columns: 0.82fr 1.18fr;
    gap: 0.8rem;
    padding-block: 4.5rem 1rem;
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
}

@media (max-width: 360px) {
  .story-hero-copy {
    width: 72%;
  }

  .story-hero h1 {
    font-size: 2.05rem;
  }

  .story-date,
  .eyebrow {
    font-size: 0.52rem;
  }

  .gallery-hint {
    max-width: 5.5rem;
    text-align: right;
  }

  .detail-copy h2 {
    font-size: 1.45rem;
  }

  .book-controls {
    gap: 0.2rem;
  }

  .book-control,
  .book-open-control,
  .book-close-control {
    padding-inline: 0.45rem;
    font-size: 0.58rem;
  }

  .page-counter {
    font-size: 0.5rem;
  }

  .final-copy {
    padding: 0.75rem;
  }

  .final-message {
    font-size: 1.5rem;
  }
}

@media (max-height: 600px) {
  .story-screen {
    padding-top: 3.65rem;
    padding-bottom: 0.7rem;
  }

  .story-hero-photo {
    height: 64svh;
  }

  .book-stage {
    height: 54svh;
  }

  .story-gallery {
    gap: 0.45rem;
  }

  .gallery-card {
    height: 58svh;
  }

  .story-detail,
  .story-finale {
    gap: 1rem;
  }

  .detail-photo,
  .final-photo {
    height: 56svh;
  }
}

@media (min-width: 901px) and (max-height: 820px) {
  .story-experience {
    scroll-snap-type: y proximity;
  }

  .story-screen {
    height: auto;
    min-height: 100svh;
  }

  .story-hero {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

  .story-hero-photo {
    height: min(60svh, 38rem);
  }

  .story-gallery {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

  .gallery-card {
    height: min(58svh, 32rem);
  }

  .detail-photo {
    height: min(60svh, 38rem);
  }

  .story-book {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

  .book-stage {
    width: min(72vw, 56rem);
    height: min(50svh, 29rem);
  }

  .cover-front {
    gap: clamp(0.3rem, 1.4svh, 0.7rem);
    padding: 0.75rem;
  }

  .cover-ornament {
    font-size: clamp(2rem, 5vw, 3.8rem);
  }

  .cover-front strong {
    font-size: clamp(1.55rem, 3.5vw, 3rem);
  }

  .cover-title {
    font-size: clamp(0.85rem, 1.7vw, 1.25rem);
  }

  .story-finale {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

  .final-photo {
    height: min(58svh, 36rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .story-experience {
    scroll-snap-type: y proximity;
  }

  .book-cover {
    transition-duration: 1ms;
  }

  .page-turn-next,
  .page-turn-previous {
    animation-duration: 1ms;
  }

  .gallery-print img {
    transition: none;
  }
}

.template-editorial-rose .story-hero { background-color: #f2d9d4; }
.template-editorial-rose .story-date,
.template-editorial-rose .story-gallery { background-color: #9c6257; }
.template-editorial-rose .story-title,
.template-editorial-rose .story-date,
.template-editorial-rose .eyebrow,
.template-editorial-rose .hero-sparkle,
.template-editorial-rose .final-sparkle { color: #8d4c50; }
.template-editorial-rose .story-date { color: white; }
.template-editorial-rose .story-gallery .eyebrow,
.template-editorial-rose .book-heading .eyebrow { color: #f4c7b9; }
.template-editorial-rose .story-greeting { background: #e9c2b9; }
.template-editorial-rose .story-detail { background: #dce8da; }
.template-editorial-rose .photo-sticker,
.template-editorial-rose .final-copy,
.template-editorial-rose .book-open-control { background: #f2d9d4; }
.template-editorial-rose .story-finale { background: #cf8b7e; }

.template-midnight-cinema .story-hero {
  color: #f6edf7;
  background-color: #19151f;
  background-image: radial-gradient(ellipse at 75% 30%, rgb(150 105 183 / 32%), transparent 48%);
}
.template-midnight-cinema .story-date,
.template-midnight-cinema .story-gallery { background-color: #392b45; }
.template-midnight-cinema .story-date,
.template-midnight-cinema .story-title,
.template-midnight-cinema .eyebrow,
.template-midnight-cinema .hero-sparkle,
.template-midnight-cinema .final-sparkle { color: #d2a7ff; }
.template-midnight-cinema .story-date { color: #211b29; background-color: #d2a7ff; }
.template-midnight-cinema .story-greeting,
.template-midnight-cinema .story-detail,
.template-midnight-cinema .story-finale { color: #f6edf7; background-color: #241e2a; }
.template-midnight-cinema .story-detail-copy > p:last-child { color: rgb(246 237 247 / 75%); }
.template-midnight-cinema .detail-copy > p:last-child { color: rgb(246 237 247 / 75%); }
.template-midnight-cinema .photo-sticker,
.template-midnight-cinema .final-copy,
.template-midnight-cinema .book-open-control { color: #211b29; background: #d2a7ff; }
.template-midnight-cinema .story-book { background-color: #120f17; background-image: radial-gradient(ellipse at 50% 70%, rgb(150 105 183 / 30%), transparent 58%); }
.template-midnight-cinema .book-page { color: #211b29; }

.template-botanical-journal .story-hero {
  background-color: #e7ebd8;
  background-image: radial-gradient(ellipse at 75% 35%, rgb(83 104 75 / 16%), transparent 52%);
}
.template-botanical-journal .story-date,
.template-botanical-journal .story-gallery { background-color: #53684b; }
.template-botanical-journal .story-date,
.template-botanical-journal .story-title,
.template-botanical-journal .eyebrow,
.template-botanical-journal .hero-sparkle,
.template-botanical-journal .final-sparkle { color: #53684b; }
.template-botanical-journal .story-date { color: white; }
.template-botanical-journal .story-gallery .eyebrow,
.template-botanical-journal .book-heading .eyebrow { color: #dce5c8; }
.template-botanical-journal .story-greeting { background: #e7dcc1; }
.template-botanical-journal .story-detail { background: #d8e2d0; }
.template-botanical-journal .story-finale { background: #bfcbab; }
.template-botanical-journal .photo-sticker,
.template-botanical-journal .final-copy,
.template-botanical-journal .book-open-control { color: #263322; background: #dce5c8; }

.template-detail {
  max-width: 32ch;
  margin: 1.25rem 0 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 1.6vw, 1.35rem);
}
.template-editorial-rose .story-hero-copy { padding-left: clamp(0rem, 3vw, 3rem); }
.template-editorial-rose .template-editorial-detail {
  border-left: 2px solid #9c6257;
  padding-left: 0.9rem;
  color: #704249;
  font-style: italic;
}
.template-editorial-rose .story-hero-photo { transform: rotate(2deg); }

.template-midnight-cinema .story-hero { grid-template-columns: 1.15fr 0.85fr; }
.template-midnight-cinema .story-hero h1 {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(3rem, 8vw, 7.5rem);
  font-weight: 400;
  letter-spacing: -0.035em;
}
.template-midnight-cinema .story-hero-photo {
  border: 0;
  border-radius: 0.4rem;
  padding: 0;
  background: transparent;
  box-shadow: 0 1.5rem 5rem rgb(0 0 0 / 48%);
  transform: none;
}
.template-midnight-cinema .story-hero-photo img { border-radius: 0.4rem; }
.template-midnight-cinema .template-cinema-detail {
  border-left: 1px solid #d2a7ff;
  padding-left: 1rem;
  color: #e2caff;
  font-style: italic;
}
.template-midnight-cinema .story-greeting { grid-template-columns: 1fr 0.8fr; }
.template-midnight-cinema .story-finale { grid-template-columns: 0.8fr 1.2fr; }

.template-botanical-journal .story-hero {
  grid-template-columns: 0.85fr 1.15fr;
  background-image: radial-gradient(ellipse at 15% 15%, rgb(255 255 255 / 54%), transparent 48%);
}
.template-botanical-journal .story-hero h1 {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(3rem, 8vw, 7.5rem);
  font-weight: 400;
  letter-spacing: -0.045em;
}
.template-botanical-journal .story-hero-photo {
  border: 1px solid #53684b;
  border-radius: 0.25rem;
  padding: 0.65rem 0.65rem 3.2rem;
  transform: rotate(-1deg);
}
.template-botanical-journal .story-greeting { grid-template-columns: 1fr 1fr; }
.template-botanical-journal .story-detail { grid-template-columns: 1.1fr 0.9fr; }
.template-botanical-journal .template-botanical-detail {
  display: inline-flex;
  width: fit-content;
  border: 1px solid #53684b;
  border-radius: 999px;
  padding: 0.55rem 0.85rem;
  color: #53684b;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
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
</style>
