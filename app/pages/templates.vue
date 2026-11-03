<template>
  <main id="main-content" tabindex="-1" class="brand-ui min-h-screen overflow-x-clip bg-background px-4 py-8 sm:px-5 md:px-12">
    <section class="mx-auto max-w-6xl pb-20 pt-16">
      <header class="template-catalog-heading">
        <div>
          <p class="catalog-eyebrow">KOLEKSI SELAMANYA</p>
          <h1 class="max-w-[18ch] text-balance font-display text-5xl md:text-7xl">Cerita kalian,<br><em>dengan caranya.</em></h1>
          <p class="catalog-intro">Lima dunia kecil. Pilih yang paling terasa seperti kalian.</p>
        </div>
        <div class="catalog-search-card">
          <div class="catalog-search-control floating-field">
            <label for="template-search" class="catalog-search-label editor-label">Temukan suasana</label>
            <AppIcon name="search" :size="19" />
            <input
              id="template-search"
              v-model="searchQuery"
              class="editor-input"
              type="search"
              maxlength="80"
              autocomplete="off"
              placeholder="Surat, sinematik, perjalanan..."
              aria-describedby="template-search-hint"
            >
            <button
              v-if="searchQuery"
              type="button"
              class="catalog-search-clear"
              aria-label="Hapus pencarian"
              @click="searchQuery = ''"
            ><AppIcon name="close" :size="17" /></button>
          </div>
          <span id="template-search-hint" class="catalog-search-hint">Cari nama atau nuansa cerita</span>
        </div>
      </header>

      <section class="catalog-filters" aria-label="Filter template">
        <div class="catalog-category-filters" role="group" aria-label="Kategori template">
          <AppButton
            :variant="!activeCategory ? 'primary' : 'secondary'"
            :aria-pressed="!activeCategory"
            @click="selectCategory('')"
          >Semua cerita</AppButton>
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

      <p class="catalog-result-count" role="status" aria-live="polite">
        {{ filteredTemplates.length }} pilihan
      </p>

      <div v-if="paginatedTemplates.length" class="template-card-grid">
        <article
          v-for="template in paginatedTemplates"
          :key="template.id"
          class="template-card"
          :style="{ '--template-paper': template.colors[0], '--template-accent': template.colors[1], '--template-ink': template.colors[2] }"
        >
          <div class="template-card-preview" :class="`template-card-${template.id}`">
            <img :src="template.thumbnail" :alt="`Contoh sampul ${template.name}`" loading="lazy" decoding="async">
            <div class="template-card-art">
              <span class="template-card-layout">{{ template.layout }}</span>
              <strong>{{ demoStory.coupleNames }}</strong>
              <span>{{ demoStory.title }}</span>
              <span class="template-card-date">{{ demoStory.date }}</span>
            </div>
          </div>
          <div class="p-6">
            <p class="template-card-mood">{{ template.mood }}</p>
            <h2 class="mt-2 line-clamp-2 font-display text-3xl">{{ template.name }}</h2>
            <p class="mt-2 min-h-14 text-pretty text-sm leading-6 text-[#756a62]">{{ template.description }}</p>
            <div class="mt-5 flex gap-3">
              <AppButton variant="secondary" class="min-w-0 flex-1" @click="previewTemplate(template.id)">
                <AppIcon name="eye" :size="16" />
                Lihat preview
              </AppButton>
              <AppButton variant="primary" class="min-w-0 flex-1" @click="chooseTemplate(template.id)">
                Pilih template
                <AppIcon name="arrow-up-right" :size="16" />
              </AppButton>
            </div>
          </div>
        </article>
      </div>
      <div v-else class="mt-4 rounded-3xl border border-[#e7ddd4] bg-white/70 px-6 py-10 text-center">
        <h2 class="font-display text-3xl">Belum ada template di kategori ini.</h2>
        <p class="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#756a62]">Coba kata kunci atau kategori lain.</p>
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
import { resolveTemplateCategory, templateCategories, type TemplateCategoryId } from '#shared/template-categories'
import { availableStoryTemplates, type StoryTemplateId } from '#shared/story-templates'

const route = useRoute()
const router = useRouter()
const previewOverlay = useTemplateRef<HTMLDivElement>('previewOverlay')
const pageSize = 6
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
  ogTitle: 'Pilih template cerita — Selamanya',
  ogDescription: 'Cari dan jelajahi template cerita berdasarkan kategori, suasana, atau komposisinya.',
  ogType: 'website',
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
.template-catalog-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.62fr);
  align-items: end;
  gap: clamp(2rem, 6vw, 5rem);
  margin-bottom: 2rem;
}
.catalog-eyebrow {
  margin: 0 0 1rem;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
}
.catalog-intro {
  max-width: 32rem;
  margin: 1.15rem 0 0;
  color: var(--color-muted-foreground);
  font-size: 0.95rem;
  line-height: 1.6;
}
.catalog-search-card {
  position: relative;
  z-index: 1;
  border: 1px solid rgb(80 69 245 / 16%);
  border-radius: 1.4rem;
  padding: 1.1rem;
  background: rgb(255 253 250 / 90%);
  box-shadow: 0 1.25rem 3rem rgb(32 29 40 / 8%);
  transform: translateY(0.35rem);
}
.catalog-search-control {
  display: flex;
  min-width: 0;
  min-height: 3.35rem;
  align-items: center;
  gap: 0.7rem;
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  padding: 0 0.65rem 0 0.9rem;
  background: var(--color-surface);
  transition: border-color var(--motion-duration-normal) var(--motion-ease-standard), box-shadow var(--motion-duration-normal) var(--motion-ease-standard);
}
.catalog-search-control > .catalog-search-label {
  top: 50%;
  left: 3rem;
  color: var(--color-muted-foreground);
  background: var(--color-surface);
  font-size: 0.83rem;
}
.catalog-search-control:focus-within > .catalog-search-label,
.catalog-search-control:has(input:not(:placeholder-shown)) > .catalog-search-label {
  top: 0;
  color: var(--color-primary);
  font-size: 0.7rem;
}
.catalog-search-control:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(80 69 245 / 13%);
}
.catalog-search-control svg {
  width: 1.2rem;
  height: 1.2rem;
  flex: 0 0 auto;
  fill: none;
  stroke: var(--color-primary);
  stroke-linecap: round;
  stroke-width: 1.8;
}
.catalog-search-control input {
  width: 100%;
  min-width: 0;
  min-height: 3.1rem;
  border: 0;
  outline: 0;
  color: var(--color-foreground);
  background: transparent;
  font: inherit;
  font-size: 0.83rem;
}
.catalog-search-control input::-webkit-search-cancel-button { display: none; }
.catalog-search-control input::placeholder { color: var(--color-muted-foreground); opacity: 0; }
.catalog-search-control input:focus::placeholder { opacity: 0.8; }
.catalog-search-clear {
  display: inline-grid;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--color-muted-foreground);
  background: var(--color-surface-muted);
  font-size: 1.3rem;
  cursor: pointer;
}
.catalog-search-clear:focus-visible,
.catalog-category-filters :deep(.app-button:focus-visible) {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 3px;
}
.catalog-search-hint {
  display: block;
  margin: 0.65rem 0.15rem 0;
  color: var(--color-muted-foreground);
  font-size: 0.7rem;
}
.catalog-filters {
  margin-top: 2.3rem;
  border-bottom: 1px solid rgb(32 29 40 / 12%);
  padding-bottom: 1rem;
}
.catalog-category-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.catalog-result-count {
  margin: 1.35rem 0 0;
  color: var(--color-muted-foreground);
  font-size: 0.76rem;
  font-weight: 600;
}
.template-card-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  margin-top: 1rem;
}
.template-card-mood {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}
.template-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e7ddd4;
  border-radius: 1.75rem;
  background: #fffdfa;
  box-shadow: 0 16px 50px rgb(35 25 20 / 6%);
  transition: transform 220ms var(--motion-ease-standard), border-color 220ms var(--motion-ease-standard), box-shadow 220ms var(--motion-ease-standard);
}
.template-card:hover,
.template-card:focus-within {
  transform: translateY(-4px) rotate(-0.25deg);
  border-color: rgb(80 69 245 / 30%);
  box-shadow: 0 20px 46px rgb(35 25 20 / 10%);
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

@media (min-width: 640px) {
  .template-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
}
@media (min-width: 1280px) {
  .template-card-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .template-catalog-heading {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.6rem;
  }
  .catalog-search-card { transform: none; }
  .catalog-filters { margin-top: 1.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .template-card { transition: none; }
  .catalog-search-control { transition: none; }
  .template-card:hover,
  .template-card:focus-within { transform: none; }
  .template-card-preview img { transition: none; }
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
