<template>
  <main id="main-content" tabindex="-1" class="brand-ui min-h-screen overflow-x-clip bg-background px-4 py-8 sm:px-5 md:px-12">
    <section class="mx-auto max-w-6xl pb-20 pt-16">
      <p class="text-xs uppercase tracking-[0.25em] text-primary">Pilih suasana cerita</p>
      <div class="mt-3 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 class="max-w-[18ch] text-balance font-display text-5xl md:text-7xl">Mulai dari tampilan<br>yang terasa <em>kalian.</em></h1>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-muted">Setiap template punya komposisi, nuansa, dan kolom cerita khasnya sendiri. Lihat preview utuh sebelum memilih; draft baru langsung tersimpan saat editor dibuka.</p>
        </div>
        <NuxtLink to="/login" class="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">Sudah punya akun? Masuk</NuxtLink>
      </div>

      <section class="mt-10" aria-label="Cari template">
        <label for="template-search" class="text-sm font-semibold">Cari berdasarkan nama atau suasana</label>
        <input
          id="template-search"
          v-model="searchQuery"
          type="search"
          maxlength="80"
          autocomplete="off"
          placeholder="Contoh: surat, perjalanan, sinematik"
          class="editor-input mt-2 max-w-xl"
        >
        <div class="mt-5 flex flex-wrap gap-2" role="group" aria-label="Kategori template">
          <AppButton
            v-for="category in templateCategories"
            :key="category.id"
            :variant="activeCategory === category.id ? 'primary' : 'secondary'"
            :aria-pressed="activeCategory === category.id"
            @click="selectCategory(category.id)"
          >
            {{ category.label }}
          </AppButton>
        </div>
      </section>

      <p class="mt-6 text-sm text-[#756a62]" role="status" aria-live="polite">
        {{ filteredTemplates.length }} template ditemukan
        <span v-if="activeCategory">di kategori {{ activeCategoryLabel }}</span>
      </p>

      <div v-if="paginatedTemplates.length" class="mt-4 grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="template in paginatedTemplates"
          :key="template.id"
          class="template-card"
          :style="{ '--template-paper': template.colors[0], '--template-accent': template.colors[1], '--template-ink': template.colors[2] }"
        >
          <div class="template-card-preview" :class="`template-card-${template.id}`">
            <img :src="template.thumbnail" :alt="`Contoh sampul ${template.name}`" loading="lazy" decoding="async">
            <div class="template-card-art">
              <span class="template-card-tag">{{ template.previewLabel }}</span>
              <span class="template-card-layout">{{ template.layout }}</span>
              <strong>{{ demoStory.coupleNames }}</strong>
              <span>{{ demoStory.title }}</span>
              <span class="template-card-date">{{ demoStory.date }}</span>
            </div>
          </div>
          <div class="p-6">
              <p class="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{{ categoryLabel(template.category) }}</p>
              <p class="text-xs uppercase tracking-[0.18em] text-primary">{{ template.mood }}</p>
            <h2 class="mt-2 line-clamp-2 font-display text-3xl">{{ template.name }}</h2>
            <p class="mt-2 min-h-14 text-pretty text-sm leading-6 text-[#756a62]">{{ template.description }}</p>
            <ul class="mt-4 grid gap-2 text-xs text-[#756a62]">
              <li v-for="highlight in template.highlights" :key="highlight" class="flex items-center gap-2">
                <span class="template-highlight-mark" aria-hidden="true">✳</span>{{ highlight }}
              </li>
            </ul>
            <div class="mt-5 flex gap-3">
              <AppButton variant="secondary" class="min-w-0 flex-1" @click="previewTemplate(template.id)">
                Lihat preview
              </AppButton>
              <AppButton variant="primary" class="min-w-0 flex-1" @click="chooseTemplate(template.id)">
                Pilih template ↗
              </AppButton>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="mt-4 rounded-3xl border border-[#e7ddd4] bg-white/70 px-6 py-10 text-center">
        <h2 class="font-display text-3xl">Belum ada template di kategori ini.</h2>
        <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#756a62]">
          Template kartu ucapan dan undangan akan ditambahkan setelah editor khususnya tersedia.
        </p>
        <AppButton class="mt-5" @click="selectCategory('')">
          Lihat semua template
        </AppButton>
      </div>

      <nav v-if="pageCount > 1" class="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Navigasi halaman template">
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="currentPage <= 1"
          @click="selectPage(currentPage - 1)"
        >Sebelumnya</AppButton>
        <AppButton
          v-for="pageNumber in pageCount"
          :key="pageNumber"
          :variant="currentPage === pageNumber ? 'primary' : 'secondary'"
          size="sm"
          class="min-w-11 px-3"
          :aria-label="`Halaman ${pageNumber}`"
          :aria-current="currentPage === pageNumber ? 'page' : undefined"
          @click="selectPage(pageNumber)"
        >{{ pageNumber }}</AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          :disabled="currentPage >= pageCount"
          @click="selectPage(currentPage + 1)"
        >Berikutnya</AppButton>
      </nav>
    </section>

    <Teleport to="body">
      <div
        v-if="previewId"
        ref="previewOverlay"
        class="template-preview-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-preview-title"
        tabindex="-1"
        @keydown="onPreviewKeydown"
      >
        <h2 id="template-preview-title" class="sr-only">
          Preview {{ activePreviewTemplate?.name ?? 'cerita' }}
        </h2>
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
    </Teleport>
  </main>
</template>

<script setup lang="ts">
import AppButton from '../components/AppButton.vue'
import { demoStory } from '#shared/demo-story'
import { categoryLabel, resolveTemplateCategory, templateCategories, type TemplateCategoryId } from '#shared/template-categories'
import { availableStoryTemplates, type StoryTemplateId } from '#shared/story-templates'

const route = useRoute()
const router = useRouter()
const previewOverlay = useTemplateRef<HTMLDivElement>('previewOverlay')
const pageSize = 4
const previewId = ref<StoryTemplateId | ''>('')
const searchQuery = ref(typeof route.query.q === 'string' ? route.query.q.slice(0, 80) : '')
const activeCategory = computed<TemplateCategoryId | ''>(() => {
  return resolveTemplateCategory(route.query.category)
})
const activePreviewTemplate = computed(() => availableStoryTemplates.find(template => template.id === previewId.value) ?? availableStoryTemplates[0])
const previewStory = computed(() => ({
  ...demoStory,
  ...(activePreviewTemplate.value ? { templateId: activePreviewTemplate.value.id } : {}),
}))
const createPath = computed(() => activePreviewTemplate.value
  ? `/studio?template=${activePreviewTemplate.value.id}&new=1`
  : '/studio')
const activeCategoryLabel = computed(() => categoryLabel(activeCategory.value))
const filteredTemplates = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('id')
  return availableStoryTemplates.filter((template) => {
    const matchesCategory = !activeCategory.value || template.category === activeCategory.value
    const matchesQuery = !query || [
      template.name,
      template.mood,
      template.description,
      template.layout,
      ...template.highlights,
    ].some(value => value.toLocaleLowerCase('id').includes(query))
    return matchesCategory && matchesQuery
  })
})
const pageCount = computed(() => Math.ceil(filteredTemplates.value.length / pageSize))
const currentPage = computed(() => {
  const requestedPage = Number(route.query.page)
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  return Math.min(page, Math.max(1, pageCount.value))
})
const paginatedTemplates = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredTemplates.value.slice(start, start + pageSize)
})
let previousBodyOverflow = ''
let previewFocusTarget: HTMLElement | null = null
const backgroundInertStates = new Map<HTMLElement, boolean>()

useSeoMeta({
  title: 'Pilih template cerita — Selamanya',
  description: 'Cari dan jelajahi template cerita berdasarkan kategori, suasana, atau komposisinya.',
})

function updateCatalogQuery(options: { category?: TemplateCategoryId | ''; page?: number; query?: string }) {
  const query = options.query?.trim().slice(0, 80) ?? searchQuery.value.trim().slice(0, 80)
  const nextQuery: Record<string, string> = {}
  if (query) nextQuery.q = query
  if (options.category) nextQuery.category = options.category
  if (options.page && options.page > 1) nextQuery.page = String(options.page)

  const currentQuery = route.query
  if (
    currentQuery.q === nextQuery.q
    && currentQuery.category === nextQuery.category
    && currentQuery.page === nextQuery.page
  ) return

  void router.replace({ query: nextQuery })
}

function selectCategory(category: TemplateCategoryId | '') {
  updateCatalogQuery({ category, page: 1 })
}

function selectPage(page: number) {
  if (page < 1 || page > pageCount.value) return
  updateCatalogQuery({ category: activeCategory.value, page })
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
let syncingSearchFromRoute = false
watch(() => route.query.q, (query) => {
  const normalizedQuery = typeof query === 'string' ? query.slice(0, 80) : ''
  if (searchQuery.value === normalizedQuery) return
  syncingSearchFromRoute = true
  searchQuery.value = normalizedQuery
  syncingSearchFromRoute = false
})

watch(searchQuery, (query) => {
  if (syncingSearchFromRoute) return
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    updateCatalogQuery({ category: activeCategory.value, page: 1, query })
  }, 200)
}, { flush: 'sync' })

function previewTemplate(id: StoryTemplateId) {
  previewFocusTarget = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null
  previewId.value = id
}

function closePreview() {
  previewId.value = ''
}

function setPreviewBackgroundInert() {
  const overlay = previewOverlay.value
  if (!overlay || backgroundInertStates.size) return

  for (const child of document.body.children) {
    if (!(child instanceof HTMLElement) || child === overlay) continue
    backgroundInertStates.set(child, child.inert)
    child.inert = true
  }
}

function restorePreviewBackground() {
  for (const [element, wasInert] of backgroundInertStates) {
    element.inert = wasInert
  }
  backgroundInertStates.clear()
}

function onPreviewKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePreview()
    return
  }
  if (event.key !== 'Tab') return

  const focusableElements = [...(previewOverlay.value?.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ) ?? [])].filter(element =>
    element.getClientRects().length > 0
    && !element.matches(':disabled')
    && !element.closest('[inert]'),
  )
  const first = focusableElements[0]
  const last = focusableElements.at(-1)
  if (!first || !last) {
    event.preventDefault()
    previewOverlay.value?.focus()
    return
  }

  if (event.shiftKey && (document.activeElement === first || !previewOverlay.value?.contains(document.activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (document.activeElement === last || !previewOverlay.value?.contains(document.activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

async function chooseTemplate(id: StoryTemplateId) {
  await navigateTo(`/studio?template=${id}&new=1`)
}

watch(previewId, (id) => {
  if (!import.meta.client) return
  if (id) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    void nextTick(() => {
      if (!previewId.value) return
      setPreviewBackgroundInert()
      previewOverlay.value?.focus()
    })
  } else {
    document.body.style.overflow = previousBodyOverflow
    restorePreviewBackground()
    const focusTarget = previewFocusTarget
    previewFocusTarget = null
    void nextTick(() => {
      if (focusTarget?.isConnected) focusTarget.focus()
    })
  }
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
  if (import.meta.client) {
    document.body.style.overflow = previousBodyOverflow
    restorePreviewBackground()
  }
})
</script>

<style scoped>
.template-card {
  min-width: 0;
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
  max-width: 100%;
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
.template-card-memory-atlas .template-card-art {
  justify-content: space-between;
  border: 1px solid rgb(37 57 67 / 38%);
  color: #253943;
  background:
    repeating-linear-gradient(0deg, transparent 0 1.55rem, rgb(53 89 107 / 12%) 1.55rem 1.6rem),
    rgb(246 241 229 / 94%);
  box-shadow: 0.6rem 0.7rem 0 rgb(53 89 107 / 18%);
}
.template-card-memory-atlas .template-card-tag {
  color: #f6f1e5 !important;
  background: #35596b;
}
.template-card-memory-atlas .template-card-layout {
  color: #35596b;
  font-size: 0.58rem;
}
.template-card-memory-atlas .template-card-art > strong {
  margin-top: auto;
  color: #253943;
  font-size: 2rem;
}
.template-card-memory-atlas .template-card-art > span:not(.template-card-tag) {
  color: #35596b;
  font-family: 'Instrument Serif', serif;
  font-size: 0.95rem;
  font-style: italic;
}
.template-card-memory-atlas img { filter: grayscale(0.65) contrast(0.85); }
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

@media (max-width: 374px) {
  .template-card-preview {
    min-height: 17rem;
    padding: 1rem;
  }

  .template-card-art {
    min-height: 14rem;
    padding: 1rem;
  }
}
</style>
