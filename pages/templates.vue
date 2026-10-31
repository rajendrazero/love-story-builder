<template>
  <main class="brand-ui min-h-screen bg-[#f7f4ed] px-5 py-8 md:px-12">
    <header class="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <NuxtLink to="/" class="font-display text-2xl">selamanya<span class="text-[#9c6257]">.</span></NuxtLink>
      <nav class="flex items-center gap-4 text-sm">
        <NuxtLink to="/account" class="text-[#9c6257]">Akun saya</NuxtLink>
        <NuxtLink to="/preview" class="text-[#9c6257]">Contoh umum</NuxtLink>
      </nav>
    </header>

    <section class="mx-auto max-w-6xl pb-20 pt-16">
      <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Pilih suasana cerita</p>
      <div class="mt-3 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 class="font-display text-5xl md:text-7xl">Mulai dari tampilan<br>yang terasa <em>kalian.</em></h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-[#756a62]">Setiap template punya komposisi, nuansa, dan kolom cerita khasnya sendiri. Lihat preview utuh sebelum memilih; draft baru langsung tersimpan saat editor dibuka.</p>
        </div>
        <NuxtLink to="/login" class="text-sm text-[#9c6257] underline underline-offset-4">Sudah punya akun? Masuk</NuxtLink>
      </div>

      <div class="mt-10 grid gap-6 sm:grid-cols-2 2xl:grid-cols-4">
        <article
          v-for="template in storyTemplates"
          :key="template.id"
          class="template-card"
          :style="{ '--template-paper': template.colors[0], '--template-accent': template.colors[1], '--template-ink': template.colors[2] }"
        >
          <div class="template-card-preview" :class="`template-card-${template.id}`">
            <img :src="demoStory.heroImage" :alt="`Contoh sampul ${template.name}`" loading="lazy">
            <div class="template-card-art">
              <span class="template-card-tag">{{ template.previewLabel }}</span>
              <span class="template-card-layout">{{ template.layout }}</span>
              <strong>{{ demoStory.coupleNames }}</strong>
              <span>{{ demoStory.title }}</span>
              <span class="template-card-date">{{ demoStory.date }}</span>
            </div>
          </div>
          <div class="p-6">
            <p class="text-xs uppercase tracking-[0.18em] text-[#9c6257]">{{ template.mood }}</p>
            <h2 class="mt-2 font-display text-3xl">{{ template.name }}</h2>
            <p class="mt-2 min-h-14 text-sm leading-6 text-[#756a62]">{{ template.description }}</p>
            <ul class="mt-4 grid gap-2 text-xs text-[#756a62]">
              <li v-for="highlight in template.highlights" :key="highlight" class="flex items-center gap-2">
                <span class="template-highlight-mark" aria-hidden="true">✳</span>{{ highlight }}
              </li>
            </ul>
            <div class="mt-5 flex gap-3">
              <button type="button" class="flex-1 rounded-full border border-[#cbbcb0] px-4 py-3 text-xs" @click="previewTemplate(template.id)">
                Lihat preview
              </button>
              <button type="button" class="flex-1 rounded-full bg-[#201d28] px-4 py-3 text-xs text-white" @click="chooseTemplate(template.id)">
                Pilih template ↗
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div
      v-if="previewId"
      class="template-preview-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="`Preview ${activePreviewTemplate.name}`"
      @keydown.esc.prevent.stop="closePreview"
    >
      <div class="mx-auto max-w-7xl">
        <StoryExperience
          :key="previewId"
          :story="previewStory"
          demo
          closable
          :create-to="createPath"
          @close="closePreview"
        />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { demoStory } from '#shared/demo-story'
import { storyTemplates, type StoryTemplateId } from '#shared/story-templates'

const previewId = ref<StoryTemplateId | ''>('')
const activePreviewTemplate = computed(() => storyTemplates.find(template => template.id === previewId.value) ?? storyTemplates[0])
const previewStory = computed(() => ({ ...demoStory, templateId: activePreviewTemplate.value.id }))
const createPath = computed(() => `/studio?template=${activePreviewTemplate.value.id}&new=1`)
let previousBodyOverflow = ''

useSeoMeta({
  title: 'Pilih template cerita — Selamanya',
  description: 'Pilih komposisi cerita, bukan hanya warna: majalah editorial, film pendek, atau jurnal perjalanan.',
})

function previewTemplate(id: StoryTemplateId) {
  previewId.value = id
}

function closePreview() {
  previewId.value = ''
}

async function chooseTemplate(id: StoryTemplateId) {
  await navigateTo(`/studio?template=${id}&new=1`)
}

watch(previewId, (id) => {
  if (!import.meta.client) return
  if (id) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = previousBodyOverflow
})
</script>

<style scoped>
.template-card {
  overflow: hidden;
  border: 1px solid #e7ddd4;
  border-radius: 1.75rem;
  background: #fffdfa;
  box-shadow: 0 16px 50px rgb(35 25 20 / 6%);
}
.template-card-preview {
  position: relative;
  display: grid;
  min-height: 20rem;
  place-items: center;
  overflow: hidden;
  padding: 1.5rem;
  color: var(--template-ink);
  background: var(--template-paper);
}
.template-card-preview::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(20 16 22 / 5%), rgb(20 16 22 / 72%));
  content: '';
}
.template-card-preview img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
  transition: transform 500ms ease;
}
.template-card:hover .template-card-preview img { transform: scale(1.05); }
.template-card-art {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(100%, 19rem);
  min-height: 16rem;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  border: 1px solid rgb(255 255 255 / 55%);
  padding: 1.3rem;
  color: white;
  background: linear-gradient(180deg, transparent 15%, rgb(20 16 22 / 53%));
  box-shadow: 0 1rem 2rem rgb(20 16 22 / 18%);
}
.template-card-layout,
.template-card-art > span:not(.template-card-tag) { font-size: 0.68rem; }
.template-card-layout {
  margin-bottom: auto;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.template-card-art > strong {
  font-family: 'Instrument Serif', serif;
  font-size: 2.3rem;
  line-height: 1;
}
.template-card-art > span:not(.template-card-tag) { margin-top: 0.45rem; }
.template-card-date { opacity: 0.76; }
.template-card-tag {
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
  border-radius: 999px;
  padding: 0.45rem 0.75rem;
  color: var(--template-ink) !important;
  background: var(--template-paper);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.template-card-midnight-cinema .template-card-art {
  align-items: center;
  justify-content: center;
  border-inline: 0;
  text-align: center;
  background: linear-gradient(180deg, transparent 10%, rgb(18 15 23 / 82%));
}
.template-card-midnight-cinema .template-card-layout {
  margin: 0 0 1rem;
  color: #e2caff;
  font-size: 0.58rem;
}
.template-card-midnight-cinema .template-card-art > span:not(.template-card-tag) {
  max-width: 22ch;
  font-family: 'Instrument Serif', serif;
  font-size: 1rem;
}
.template-card-midnight-cinema img { filter: saturate(0.55) contrast(1.1); }
.template-card-botanical-journal .template-card-art {
  width: min(100%, 18rem);
  min-height: 17rem;
  border: 0.45rem solid #f5f0e2;
  outline: 1px solid rgb(83 104 75 / 80%);
  outline-offset: -0.75rem;
  color: #fffaf0;
  background: linear-gradient(180deg, transparent 15%, rgb(38 51 34 / 78%));
}
.template-card-botanical-journal .template-card-layout {
  font-family: 'Instrument Serif', serif;
  font-size: 1rem;
  letter-spacing: 0.03em;
  text-transform: none;
}
.template-card-botanical-journal img { filter: sepia(0.28) saturate(0.76); }
.template-card-love-letter .template-card-art {
  justify-content: center;
  border: 0.45rem solid #f5e8d5;
  outline: 1px solid rgb(153 93 80 / 62%);
  outline-offset: -0.85rem;
  color: #342923;
  background:
    repeating-linear-gradient(0deg, transparent 0 1.65rem, rgb(153 93 80 / 10%) 1.65rem 1.7rem),
    linear-gradient(140deg, rgb(255 249 236 / 94%), rgb(245 232 213 / 88%));
  box-shadow: 0 1rem 2rem rgb(20 16 22 / 16%);
}
.template-card-love-letter .template-card-tag {
  color: #fffaf5 !important;
  background: #995d50;
}
.template-card-love-letter .template-card-art > strong {
  margin-top: 1rem;
  color: #49362f;
  font-size: 2rem;
  font-style: italic;
}
.template-card-love-letter .template-card-art > span:not(.template-card-tag) {
  color: #69483e;
  font-family: 'Instrument Serif', serif;
  font-size: 1rem;
  font-style: italic;
  line-height: 1.2;
}
.template-card-love-letter img { filter: sepia(0.35) saturate(0.72); }
.template-highlight-mark { color: #5045f5; font-size: 0.8rem; }
.template-preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgb(32 29 40 / 92%);
  scrollbar-gutter: stable;
}
</style>
