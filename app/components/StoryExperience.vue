<template>
  <component
    :is="closable ? 'div' : 'main'"
    :id="closable ? undefined : 'main-content'"
    :tabindex="closable ? undefined : -1"
    ref="experience"
    class="story-experience bg-paper"
    :class="[`template-${story.templateId ?? 'editorial-rose'}`, { 'is-demo': demo }]"
  >
    <div v-if="demo" class="preview-bar" :class="{ 'preview-bar-overlay': closable }">
      <label class="preview-music-input">
        <span>Musik preview</span>
        <input
          v-model="previewMusicUrl"
          name="previewMusicUrl"
          type="url"
          placeholder="Spotify / YouTube Music"
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
        <button v-if="closable" type="button" class="preview-close" @click="emit('close')">Tutup ×</button>
        <NuxtLink :to="createTo" class="preview-link">Buat versiku ↗</NuxtLink>
      </div>
    </div>

    <component :is="storyLayout">
    <template #hero>
    <section class="story-screen story-hero">
      <div class="story-hero-copy">
        <p class="story-date">{{ story.date }}</p>
        <h1>{{ story.coupleNames }}</h1>
        <p class="story-title">{{ story.title }}</p>
        <p
          v-if="['editorial-rose', 'love-letter'].includes(story.templateId ?? '') && story.templateDetails?.editorialRose?.dedication"
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
        <StoryMusicPlayer
          :music-url="story.musicUrl"
          :preview-music-url="previewMusicUrl"
          :demo="demo"
        />
      </div>
      <figure class="story-hero-photo">
        <img :src="story.heroImage" :alt="story.coupleNames">
        <figcaption>this is so us ♡</figcaption>
      </figure>
      <span class="hero-sparkle" aria-hidden="true">✳</span>
    </section>
    </template>

    <template #greeting>
      <StorySectionRenderer :story="story" section="greeting" />
    </template>

    <template #gallery>
      <StoryGallery :photos="story.gallery" :template-id="story.templateId" />
    </template>

    <template #detail>
      <StorySectionRenderer :story="story" section="detail" />
    </template>

    <template #book>
      <StoryBookInteraction :story="story" />
    </template>

    <template #finale>
      <StorySectionRenderer :story="story" section="finale" />
    </template>
    </component>
    <footer class="story-footer">Disimpan di sini, <span>selamanya.</span></footer>
  </component>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { StoryContent } from '#shared/schema/story'
import { availableStoryTemplates, getTemplateDefinition, storyTemplateSchema, type StoryTemplateId } from '#shared/story-templates'
import { templateRenderers } from '~/components/story-templates/registry'
import StoryGallery from '~/components/story-experience/StoryGallery.vue'
import StoryMusicPlayer from '~/components/story-experience/StoryMusicPlayer.vue'
import StoryBookInteraction from '~/components/story-experience/StoryBookInteraction.vue'
import StorySectionRenderer from '~/components/story-experience/StorySectionRenderer.vue'

const props = withDefaults(defineProps<{
  story: StoryContent
  demo?: boolean
  createTo?: string
  templatePicker?: boolean
  closable?: boolean
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
const storyLayout = computed(() => {
  const template = getTemplateDefinition(props.story.templateId ?? 'editorial-rose')
  return templateRenderers[template?.renderer ?? 'EditorialRoseLayout']
})
const previewMusicUrl = ref(props.story.musicUrl)
let motionMedia: gsap.MatchMedia | undefined
const appCursorPreset = useState<NonNullable<StoryContent['cursorPreset']>>('story-cursor', () => 'system')

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
  if (!root) return

  gsap.registerPlugin(ScrollTrigger)
  motionMedia = gsap.matchMedia(root)
  const scroller = getScrollContainer(root)
  motionMedia.add('(prefers-reduced-motion: no-preference)', () => {
    const revealGroups: Record<string, string> = {
      'story-hero': '.story-hero-copy, .story-hero-photo',
      'story-greeting': '.greeting-copy, .greeting-photo',
      'story-gallery': '.section-heading, .gallery-card',
      'story-detail': '.detail-photo, .detail-copy',
      'story-book': '.book-heading, .book-stage, .book-controls',
      'story-finale': '.final-photo, .final-copy',
    }

    root.querySelectorAll<HTMLElement>('.story-screen').forEach((section) => {
      const sectionName = [...section.classList].find(name => name in revealGroups)
      const revealGroup = sectionName ? revealGroups[sectionName] : undefined
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
          ...(scroller ? { scroller } : {}),
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
          ...(scroller ? { scroller } : {}),
          start: 'top bottom',
          end: 'bottom top',
          scrub: 0.7,
        },
      })
    })
    ScrollTrigger.refresh()
  })
})

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

<style scoped>
.story-experience {
  --screen-pad: clamp(1rem, 5vw, 5rem);
  overflow: clip;
  scroll-snap-type: y mandatory;
}

.preview-bar {
  position: fixed;
  inset: 4.25rem 0 auto;
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
  gap: 0.18rem;
  color: rgb(255 255 255 / 70%);
  font-size: 0.56rem;
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

  .story-detail,
  .story-finale {
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

.template-editorial-rose .story-hero { background-color: #f2d9d4; }
.template-editorial-rose .story-date { background-color: #9c6257; }
.template-editorial-rose .story-title,
.template-editorial-rose .story-date,
.template-editorial-rose .hero-sparkle { color: #8d4c50; }
.template-editorial-rose .story-date { color: white; }
.template-editorial-rose .story-greeting { background: #e9c2b9; }
.template-editorial-rose .story-detail { background: #dce8da; }
.template-editorial-rose .story-finale { background: #cf8b7e; }

.template-midnight-cinema .story-hero {
  color: #f6edf7;
  background-color: #19151f;
  background-image: radial-gradient(ellipse at 75% 30%, rgb(150 105 183 / 32%), transparent 48%);
}
.template-midnight-cinema .story-date { background-color: #392b45; }
.template-midnight-cinema .story-date,
.template-midnight-cinema .story-title,
.template-midnight-cinema .hero-sparkle { color: #d2a7ff; }
.template-midnight-cinema .story-date { color: #211b29; background-color: #d2a7ff; }
.template-midnight-cinema .story-greeting,
.template-midnight-cinema .story-detail,
.template-midnight-cinema .story-finale { color: #f6edf7; background-color: #241e2a; }

.template-botanical-journal .story-hero {
  background-color: #e7ebd8;
  background-image: radial-gradient(ellipse at 75% 35%, rgb(83 104 75 / 16%), transparent 52%);
}
.template-botanical-journal .story-date { background-color: #53684b; }
.template-botanical-journal .story-date,
.template-botanical-journal .story-title,
.template-botanical-journal .hero-sparkle { color: #53684b; }
.template-botanical-journal .story-date { color: white; }
.template-botanical-journal .story-greeting { background: #e7dcc1; }
.template-botanical-journal .story-detail { background: #d8e2d0; }
.template-botanical-journal .story-finale { background: #bfcbab; }

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
.template-editorial-rose .story-hero {
  grid-template-columns: 1fr 0.95fr;
  background-image:
    radial-gradient(ellipse at 88% 14%, rgb(255 250 245 / 72%), transparent 31%),
    repeating-linear-gradient(0deg, transparent 0 2.4rem, rgb(141 76 80 / 5%) 2.4rem 2.45rem);
}
.template-editorial-rose .story-hero-photo {
  border: 0.65rem solid #fffaf5;
  border-bottom-width: 3.2rem;
  border-radius: 0.2rem;
  padding: 0;
  background: #fffaf5;
  box-shadow: 0 1.2rem 3rem rgb(89 48 52 / 18%);
  transform: rotate(2deg);
}
.template-editorial-rose .story-hero-photo figcaption {
  right: 0.5rem;
  bottom: -2.35rem;
  color: #704249;
  font-family: 'Instrument Serif', serif;
  font-size: 1.05rem;
}
.template-midnight-cinema .story-hero {
  position: relative;
  isolation: isolate;
  grid-template-columns: 1fr;
  align-items: end;
  background-image:
    linear-gradient(90deg, #120f17 4%, rgb(18 15 23 / 88%) 35%, rgb(18 15 23 / 28%) 100%),
    radial-gradient(ellipse at 80% 25%, rgb(150 105 183 / 32%), transparent 48%);
}
.template-midnight-cinema .story-hero-copy {
  z-index: 2;
  max-width: 54rem;
  padding-bottom: clamp(1rem, 8svh, 5rem);
}
.template-midnight-cinema .story-hero-photo {
  position: absolute;
  inset: 0 0 0 32%;
  z-index: 0;
  width: auto;
  height: auto;
  margin: 0;
  border: 0;
  border-radius: 0;
  padding: 0;
  opacity: 0.68;
  box-shadow: none;
}
.template-midnight-cinema .story-hero-photo img {
  border-radius: 0;
  object-position: center;
}
.template-midnight-cinema .story-hero-photo figcaption { display: none; }
.template-midnight-cinema .story-date {
  border: 1px solid rgb(210 167 255 / 54%);
  background: rgb(25 21 31 / 72%);
}
.template-midnight-cinema .story-greeting {
  grid-template-columns: 1.1fr 0.9fr;
  background-image: radial-gradient(ellipse at 10% 70%, rgb(150 105 183 / 22%), transparent 50%);
}
.template-midnight-cinema .story-finale {
  grid-template-columns: 0.9fr 1.1fr;
  background-image: radial-gradient(ellipse at 85% 50%, rgb(150 105 183 / 20%), transparent 52%);
}

.template-botanical-journal .story-hero {
  grid-template-columns: 0.9fr 1.1fr;
  background-image:
    radial-gradient(ellipse at 12% 18%, rgb(255 255 255 / 66%), transparent 42%),
    repeating-linear-gradient(0deg, transparent 0 2.1rem, rgb(83 104 75 / 7%) 2.1rem 2.15rem);
}
.template-botanical-journal .story-hero-photo {
  border: 0.7rem solid #f8f4e8;
  border-bottom-width: 3rem;
  border-radius: 50% 50% 0.4rem 0.4rem;
  padding: 0;
  box-shadow: 0 1rem 2.5rem rgb(38 51 34 / 20%);
  transform: rotate(-1.5deg);
}
.template-botanical-journal .story-hero-photo img { border-radius: inherit; }
.template-botanical-journal .story-hero-photo figcaption {
  right: 0;
  bottom: -2.2rem;
  color: #53684b;
  font-family: 'Instrument Serif', serif;
  font-size: 1rem;
}
.template-botanical-journal .story-greeting {
  grid-template-columns: 1fr 1.1fr;
  background-image: repeating-linear-gradient(0deg, transparent 0 2.2rem, rgb(83 104 75 / 6%) 2.2rem 2.25rem);
}
.template-botanical-journal .story-detail {
  grid-template-columns: 1.1fr 0.9fr;
  background-image: repeating-linear-gradient(0deg, transparent 0 2.2rem, rgb(83 104 75 / 6%) 2.2rem 2.25rem);
}
.template-botanical-journal .story-finale {
  grid-template-columns: 1fr 1fr;
  background-image: radial-gradient(ellipse at 20% 50%, rgb(255 255 255 / 46%), transparent 45%);
}

@media (max-width: 760px) {
  .template-midnight-cinema .story-hero,
  .template-editorial-rose .story-hero,
  .template-botanical-journal .story-hero,
  .template-love-letter .story-hero { grid-template-columns: 1fr; }
  .template-midnight-cinema .story-hero-photo,
  .template-editorial-rose .story-hero-photo,
  .template-botanical-journal .story-hero-photo,
  .template-love-letter .story-hero-photo {
    position: absolute;
    inset: 15% 5% auto auto;
    width: 53%;
    height: 55%;
  }
  .template-midnight-cinema .story-hero-photo {
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.42;
  }
  .template-midnight-cinema .story-hero-photo img { border-radius: 0; }
  .template-midnight-cinema .story-hero-copy { align-self: end; }
  .template-editorial-rose .story-hero-copy,
  .template-botanical-journal .story-hero-copy,
  .template-love-letter .story-hero-copy { align-self: end; width: 72%; }
  .template-botanical-journal .story-detail { grid-template-columns: 1fr 1fr; }
}

.template-love-letter {
  --letter-paper: #f5e8d5;
  --letter-ink: #342923;
  --letter-accent: #995d50;
  color: var(--letter-ink);
}
.template-love-letter .story-hero,
.template-love-letter .story-greeting,
.template-love-letter .story-detail,
.template-love-letter .story-finale {
  background-color: var(--letter-paper);
  background-image:
    radial-gradient(ellipse at 10% 12%, rgb(255 255 255 / 74%), transparent 38%),
    repeating-linear-gradient(0deg, transparent 0 2.25rem, rgb(153 93 80 / 7%) 2.25rem 2.3rem);
}
.template-love-letter .story-hero-copy {
  border-left: 1px solid rgb(153 93 80 / 35%);
  padding: clamp(1rem, 4vw, 3rem);
}
.template-love-letter .story-hero h1,
.template-love-letter .story-title {
  color: #49362f;
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.035em;
}
.template-love-letter .story-hero h1 { font-size: clamp(3.2rem, 8.5vw, 7.5rem); }
.template-love-letter .story-title { color: var(--letter-accent); }
.template-love-letter .story-date {
  color: #fffaf5;
  background: var(--letter-accent);
  transform: rotate(-1deg);
}
.template-love-letter .story-date,
.template-love-letter .hero-sparkle { color: var(--letter-accent); }
.template-love-letter .story-date { color: #fffaf5; }

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
  .preview-link,
  .preview-close { padding: 0.45rem 0.6rem; font-size: 0.64rem; }
}

@media (max-width: 760px) {
  .template-love-letter .story-hero-copy { width: 77%; }
  .template-love-letter .story-detail { grid-template-columns: 0.9fr 1.1fr; }
  .template-love-letter .story-finale { grid-template-columns: 0.85fr 1.15fr; }
}

.template-memory-atlas {
  --atlas-paper: #e8e2d2;
  --atlas-ink: #253943;
  --atlas-accent: #35596b;
  color: var(--atlas-ink);
  background: var(--atlas-paper);
  scroll-snap-type: none;
}

.template-memory-atlas .story-screen {
  height: auto;
  min-height: 0;
  overflow: visible;
  padding: clamp(2.5rem, 7vw, 6rem) var(--screen-pad);
  scroll-snap-align: none;
  scroll-snap-stop: normal;
}

.template-memory-atlas .story-hero {
  min-height: 100svh;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(1.5rem, 6vw, 6rem);
  background:
    linear-gradient(135deg, rgb(255 255 255 / 28%), transparent 48%),
    var(--atlas-paper);
}

.template-memory-atlas .story-hero-copy {
  padding-left: clamp(0rem, 4vw, 4rem);
}

.template-memory-atlas .story-hero h1 {
  color: var(--atlas-ink);
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  letter-spacing: -0.035em;
}

.template-memory-atlas .story-hero h1 { font-size: clamp(3.5rem, 9vw, 8rem); }
.template-memory-atlas .story-title { color: var(--atlas-accent); }
.template-memory-atlas .story-date {
  color: #f6f1e5;
  background: var(--atlas-accent);
  transform: none;
}
.template-memory-atlas .hero-sparkle { color: var(--atlas-accent); }
.template-memory-atlas .story-hero-photo {
  position: relative;
  inset: auto;
  width: 100%;
  height: min(72svh, 48rem);
  border: 0.65rem solid #f6f1e5;
  border-radius: 0.15rem;
  padding: 0.35rem;
  background: #f6f1e5;
  box-shadow: 1.2rem 1.2rem 0 rgb(53 89 107 / 18%);
  opacity: 1;
  transform: rotate(1deg);
}
.template-memory-atlas .story-hero-photo img { border-radius: 0; }
.template-memory-atlas .story-hero-photo figcaption {
  bottom: -2.6rem;
  color: var(--atlas-accent);
}

.template-memory-atlas :deep(.atlas-timeline) {
  width: min(100%, 78rem);
  margin-inline: auto;
  padding-block: 3rem;
}
.template-memory-atlas :deep(.atlas-timeline .story-screen) {
  position: relative;
  min-height: 30rem;
  margin: 0 0 3rem 2.5rem;
  border: 1px solid rgb(37 57 67 / 13%);
  border-radius: 0.2rem;
  padding: clamp(1.25rem, 4vw, 3.5rem);
  background: #f6f1e5;
  box-shadow: 0 1rem 2rem rgb(37 57 67 / 7%);
}
.template-memory-atlas :deep(.atlas-timeline .story-screen)::before {
  position: absolute;
  top: 2rem;
  left: -3.2rem;
  display: grid;
  width: 1.2rem;
  height: 1.2rem;
  place-items: center;
  border: 3px solid var(--atlas-paper);
  border-radius: 50%;
  background: var(--atlas-accent);
  box-shadow: 0 0 0 1px var(--atlas-accent);
  content: '';
}
.template-memory-atlas :deep(.atlas-timeline .story-greeting)::after,
.template-memory-atlas :deep(.atlas-timeline .story-detail)::after {
  position: absolute;
  top: 2rem;
  right: 2rem;
  color: var(--atlas-accent);
  font-family: 'Space Grotesk', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.16em;
}
.template-memory-atlas :deep(.atlas-timeline .story-greeting)::after { content: '01 / A NOTE'; }
.template-memory-atlas :deep(.atlas-timeline .story-detail)::after { content: '02 / THE BEGINNING'; }

.template-memory-atlas .story-greeting {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  gap: 2rem;
  background-image: repeating-linear-gradient(0deg, transparent 0 2.1rem, rgb(53 89 107 / 7%) 2.1rem 2.15rem);
}
.template-memory-atlas .story-detail {
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  gap: 2rem;
  background-image: linear-gradient(115deg, rgb(53 89 107 / 7%), transparent 55%);
}

.template-memory-atlas .story-finale {
  min-height: 78svh;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  background: #d6dece;
}
@media (max-width: 700px) {
  .template-memory-atlas .story-screen {
    padding: 2.5rem 1rem;
  }
  .template-memory-atlas .story-hero {
    min-height: 88svh;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .template-memory-atlas .story-hero-photo {
    height: min(42svh, 25rem);
  }
  .template-memory-atlas :deep(.atlas-timeline) { padding-block: 1rem; }
  .template-memory-atlas :deep(.atlas-timeline .story-screen) {
    min-height: 0;
    margin: 0 0 1.5rem 1.7rem;
    padding: 3.5rem 1rem 1.25rem;
  }
  .template-memory-atlas :deep(.atlas-timeline .story-greeting),
  .template-memory-atlas :deep(.atlas-timeline .story-detail) {
    grid-template-columns: 1fr;
  }
  .template-memory-atlas :deep(.atlas-timeline .story-screen)::before { left: -2.35rem; }
  .template-memory-atlas :deep(.atlas-timeline .story-screen)::after { top: 1.25rem; right: 1rem; }
  .template-memory-atlas .story-finale {
    min-height: 0;
    grid-template-columns: 1fr;
  }
}
</style>
