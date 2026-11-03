<template>
  <MusicEngine :source="activeMusicUrl">
    <component
      :is="closable ? 'div' : 'main'"
      :id="closable ? undefined : 'main-content'"
      :tabindex="closable ? undefined : -1"
      ref="experience"
      class="story-experience bg-paper"
      :class="[`template-${story.templateId ?? 'editorial-rose'}`, { 'is-demo': demo }]"
    >
      <div v-if="demo" class="preview-bar" :class="{ 'preview-bar-overlay': closable }">
        <label class="preview-music-input floating-field">
          <span class="editor-label">Musik preview</span>
          <input
            v-model="previewMusicUrl"
            name="previewMusicUrl"
            class="editor-input"
            type="url"
            placeholder="URL HTTPS file audio langsung"
            autocomplete="url"
          >
        </label>
        <span v-if="!templatePicker" class="preview-label">Pratinjau template · konten contoh</span>
        <div class="preview-actions">
          <label v-if="templatePicker" class="preview-template-label">
            <span class="sr-only">Pilih gaya cerita</span>
            <select id="preview-template" name="template" :value="story.templateId" class="preview-template-select" @change="selectTemplate">
              <option v-for="template in availableStoryTemplates" :key="template.id" :value="template.id">
                {{ template.name }}
              </option>
            </select>
          </label>
          <button v-if="closable" type="button" class="preview-close" @click="emit('close')"><AppIcon name="close" :size="15" />Tutup</button>
          <NuxtLink :to="createTo" class="preview-link">Buat versiku <AppIcon name="arrow-up-right" :size="15" /></NuxtLink>
        </div>
      </div>

      <div class="story-content" :inert="!experienceReady" :aria-hidden="!experienceReady">
        <component :is="storyLayout">
          <StorySectionHost
            v-for="section in orderedSections"
            :key="section.id"
            :story="story"
            :section="section"
            :story-slug="storySlug"
            :story-password="storyPassword"
          />
        </component>
        <footer class="story-footer">Disimpan di sini, <span>selamanya.</span></footer>
      </div>
      <FloatingMusicPlayer
        v-if="experienceReady"
        :artist="story.musicArtist"
        :title="story.musicTitle"
      />
      <Teleport to="body">
        <Transition name="story-entrance" @after-leave="finishEntrance">
          <EntranceCover
            v-if="!entranceDismissed"
            :story="story"
            @open="dismissEntrance"
          />
        </Transition>
      </Teleport>
    </component>
  </MusicEngine>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { StoryContent } from '#shared/schema/story'
import { availableStoryTemplates, getTemplateDefinition, storyTemplateSchema, type StoryTemplateId } from '#shared/story-templates'
import { sortStorySections, type StorySectionEntrance } from '#shared/story-sections'
import { templateRenderers } from '~/components/story-templates/registry'
import MusicEngine from '~/components/story-experience/MusicEngine.vue'
import EntranceCover from '~/components/story-experience/EntranceCover.vue'
import FloatingMusicPlayer from '~/components/story-experience/FloatingMusicPlayer.vue'
import StorySectionHost from '~/components/story-experience/StorySectionHost.vue'

const props = withDefaults(defineProps<{
  story: StoryContent
  demo?: boolean
  createTo?: string
  templatePicker?: boolean
  closable?: boolean
  storySlug?: string
  storyPassword?: string
}>(), {
  demo: false,
  createTo: '/templates',
  templatePicker: false,
  closable: false,
})
const emit = defineEmits<{
  close: []
  selectTemplate: [id: StoryTemplateId]
}>()

const experience = ref<HTMLElement | null>(null)
const needsEntrance = computed(() => !props.demo && !props.closable)
const entranceDismissed = ref(!needsEntrance.value)
const experienceReady = ref(!needsEntrance.value)
const storyLayout = computed(() => {
  const template = getTemplateDefinition(props.story.templateId ?? 'editorial-rose')
  return templateRenderers[template?.renderer ?? 'EditorialRoseLayout']
})
const orderedSections = computed(() => {
  const template = getTemplateDefinition(props.story.templateId ?? 'editorial-rose')
  return sortStorySections(props.story.sectionLayout ?? template?.sections ?? [])
})
const previewMusicUrl = ref(props.story.musicUrl)
const activeMusicUrl = computed(() => props.demo ? previewMusicUrl.value.trim() : props.story.musicUrl)
let motionMedia: gsap.MatchMedia | undefined
const appCursorPreset = useState<NonNullable<StoryContent['cursorPreset']>>('story-cursor', () => 'system')

watch(needsEntrance, (required) => {
  entranceDismissed.value = !required
  experienceReady.value = !required
})

function dismissEntrance(): void {
  entranceDismissed.value = true
}

async function finishEntrance(): Promise<void> {
  experienceReady.value = true
  await nextTick()
  experience.value?.focus()
}

watch(() => props.story.cursorPreset, (preset) => {
  appCursorPreset.value = preset ?? 'system'
})

function selectTemplate(event: Event) {
  const selected = storyTemplateSchema.safeParse((event.currentTarget as HTMLSelectElement).value)
  if (selected.success) emit('selectTemplate', selected.data)
}

onMounted(() => {
  appCursorPreset.value = props.story.cursorPreset ?? 'system'
  const root = experience.value
  if (root) setupSectionMotion(root)
})

watch(orderedSections, async () => {
  await nextTick()
  const root = experience.value
  if (root) setupSectionMotion(root)
}, { flush: 'post' })

function setupSectionMotion(root: HTMLElement): void {
  motionMedia?.revert()
  gsap.registerPlugin(ScrollTrigger)
  motionMedia = gsap.matchMedia(root)
  const scroller = getScrollContainer(root)
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const entranceMotion: Record<StorySectionEntrance, { x: number, y: number, scale: number }> = {
      'fade-up': { x: 0, y: 22, scale: 1 },
      'slide-left': { x: -28, y: 0, scale: 1 },
      'slide-right': { x: 28, y: 0, scale: 1 },
      zoom: { x: 0, y: 0, scale: 0.96 },
    }

    orderedSections.value.forEach((config) => {
      const section = [...root.querySelectorAll<HTMLElement>('[data-story-section]')]
        .find(element => element.dataset.storySection === config.type)
      if (!section) return

      const targets = [...section.children]
        .filter((element): element is HTMLElement => element instanceof HTMLElement)
        .filter(element => !element.classList.contains('story-section-decorations'))
      if (targets.length) {
        gsap.from(targets, {
          ...entranceMotion[config.animation.entrance],
          autoAlpha: 0,
          duration: 0.78,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            ...(scroller ? { scroller } : {}),
            start: 'top 74%',
            once: true,
          },
        })
      }

      if (config.animation.scroll === 'parallax') {
        const image = section.querySelector<HTMLElement>('img')
        if (image) {
          gsap.fromTo(image, {
            yPercent: 6,
            scale: 1.06,
          }, {
            yPercent: -6,
            scale: 1.02,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              ...(scroller ? { scroller } : {}),
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          })
        }
      } else if (config.animation.scroll === 'fade') {
        gsap.fromTo(section, {
          autoAlpha: 0.72,
        }, {
          autoAlpha: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            ...(scroller ? { scroller } : {}),
            start: 'top 85%',
            end: 'top 35%',
            scrub: 0.5,
          },
        })
      }
    })
    ScrollTrigger.refresh()
  })
}

function getScrollContainer(element: HTMLElement): HTMLElement | undefined {
  let ancestor = element.parentElement
  while (ancestor) {
    const { overflowY } = getComputedStyle(ancestor)
    if (/(auto|scroll|overlay)/.test(overflowY) && ancestor.scrollHeight > ancestor.clientHeight) {
      return ancestor
    }
    ancestor = ancestor.parentElement
  }
}

onBeforeUnmount(() => {
  appCursorPreset.value = 'system'
  motionMedia?.revert()
})
</script>

<style>
.story-experience {
  --screen-pad: clamp(1rem, 5vw, 5rem);
  position: relative;
  overflow: clip;
  scroll-snap-type: y proximity;
}

.story-content {
  position: relative;
}

.story-screen {
  isolation: isolate;
}

.story-section-decorations {
  z-index: 0;
  opacity: 0.2;
}

.story-screen > :not(.story-section-decorations):not(.hero-sparkle):not(.final-sparkle) {
  z-index: 1;
}

.story-gallery > .story-section-decorations,
.story-finale > .story-section-decorations {
  opacity: 0.28;
}

.story-entrance-leave-active {
  transition: opacity 720ms ease, transform 720ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.story-entrance-leave-to {
  opacity: 0;
  transform: scale(1.035);
}

.story-entrance-leave-active .entrance-cover-content {
  transition: transform 650ms cubic-bezier(0.2, 0.7, 0.2, 1), opacity 650ms ease;
}

.story-entrance-leave-to .entrance-cover-content {
  opacity: 0;
  transform: translateY(-0.75rem);
}

@media (prefers-reduced-motion: reduce) {
  .story-entrance-leave-active {
    transition-duration: 1ms;
  }
}

.preview-bar {
  position: fixed;
  inset: 4.25rem 0 auto;
  z-index: var(--z-preview);
  display: flex;
  height: 3rem;
  align-items: center;
  justify-content: space-between;
  padding-inline: var(--screen-pad);
  color: #fffaf5;
  background: rgb(32 29 40 / 92%);
  backdrop-filter: blur(14px);
}

.preview-bar-overlay {
  top: 0;
}

.preview-brand {
  font-family: 'Instrument Serif', serif;
  font-size: 1.25rem;
  text-decoration: none;
}

.preview-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: clamp(0.35rem, 1.5vw, 1rem);
}

.preview-music-input {
  display: grid;
  min-width: 10rem;
  min-height: 2rem;
  gap: 0.18rem;
  color: rgb(255 255 255 / 70%);
  font-size: 0.56rem;
  --floating-label-background: #302b39;
}

.preview-music-input > .editor-label {
  color: rgb(255 255 255 / 70%);
}

.preview-music-input:focus-within > .editor-label {
  color: #ffd6b8;
}

.preview-music-input input {
  width: min(28vw, 15rem);
  min-width: 9rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  color: #fffaf5;
  background: #302b39;
  font-size: 0.66rem;
}

.preview-template-select {
  max-width: min(38vw, 13rem);
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 999px;
  padding: 0.5rem 1.8rem 0.5rem 0.8rem;
  color: #fffaf5;
  background: #302b39;
  font-size: 0.72rem;
}

.preview-template-select option { color: #201d28; background: #fffaf5; }

.preview-close {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 999px;
  padding: 0.5rem 0.8rem;
  color: #fffaf5;
  background: transparent;
  font-size: 0.72rem;
  cursor: pointer;
}

.preview-label {
  color: rgb(255 255 255 / 65%);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.preview-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
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
  height: auto;
  min-height: 100vh;
  min-height: 100svh;
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

.story-date {
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

.story-hero-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.story-hero-photo img {
  border-radius: 1rem;
}

.story-hero-photo figcaption {
  position: absolute;
  bottom: 0.48rem;
  left: 1rem;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 2vw, 1.4rem);
  font-style: italic;
}

.hero-sparkle {
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

.story-detail {
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(1rem, 5vw, 5rem);
  background: #dcefe1;
}

.story-finale {
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: clamp(1rem, 5vw, 5rem);
  background: #ff7968;
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
    grid-template-rows: auto minmax(42svh, 1fr);
    padding-top: 4.2rem;
  }

  .story-detail {
    grid-template-columns: 0.9fr 1.1fr;
    gap: 0.75rem;
    padding-block: 4.6rem 1rem;
  }

  .story-finale {
    grid-template-columns: 0.82fr 1.18fr;
    gap: 0.8rem;
    padding-block: 4.5rem 1rem;
  }

}

@media (max-width: 360px) {
  .story-hero-copy {
    width: 72%;
  }

  .story-hero h1 {
    font-size: 2.05rem;
  }

  .story-date {
    font-size: 0.52rem;
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

  .story-detail, .story-finale {
    gap: 1rem;
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

  .story-finale {
    padding-top: 4rem;
    padding-bottom: 1rem;
  }

}

@media (prefers-reduced-motion: reduce) {
  .story-experience {
    scroll-snap-type: y proximity;
  }

}

.template-detail {
  max-width: 32ch;
  margin: 1.25rem 0 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1rem, 1.6vw, 1.35rem);
}

@media (max-width: 760px) {
  .preview-bar {
    gap: 0.5rem;
    padding-inline: 0.8rem;
  }

  .preview-bar:not(.preview-bar-overlay) { top: 3.8rem; }
  .preview-music-input { min-width: 0; }
  .preview-music-input input { min-width: 6rem; width: 28vw; }
  .preview-actions { gap: 0.35rem; }
  .preview-template-select { max-width: 34vw; padding-inline: 0.55rem 1.4rem; font-size: 0.65rem; }
  .preview-link, .preview-close { padding: 0.45rem 0.6rem; font-size: 0.64rem; }
}
</style>

<style src="../assets/css/templates/editorial-rose.css"></style>

<style src="../assets/css/templates/midnight-cinema.css"></style>

<style src="../assets/css/templates/botanical-journal.css"></style>

<style src="../assets/css/templates/love-letter.css"></style>

<style src="../assets/css/templates/memory-atlas.css"></style>

<style>
@media (max-width: 760px) {
  .preview-bar {
    gap: 0.35rem;
    padding-inline: 0.5rem;
  }

  .preview-music-input {
    position: relative;
    flex: 0 1 7rem;
    width: min(28vw, 8rem);
  }

  .preview-music-input > .editor-label {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    clip-path: inset(50%);
  }

  .preview-music-input input {
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    font-size: 0.7rem;
  }

  .preview-template-select,
  .preview-link,
  .preview-close {
    min-height: 2.75rem;
    font-size: 0.7rem;
  }
}

@media (max-width: 600px) {
  .story-experience .story-detail,
  .story-experience .story-finale {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto;
    align-content: center;
    gap: clamp(0.75rem, 2.5svh, 1.25rem);
    padding-block: clamp(4rem, 8svh, 5rem) 1rem;
  }
}
</style>
