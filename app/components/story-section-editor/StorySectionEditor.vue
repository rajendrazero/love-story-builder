<template>
  <section class="section-editor" :data-template-id="templateId" aria-labelledby="section-editor-title">
    <header class="section-editor-heading">
      <div>
        <p class="section-editor-kicker">Komposisi cerita</p>
        <h3 id="section-editor-title">Susun section sesuai kisah kalian</h3>
      </div>
      <p>{{ enabledSections.length }} section aktif</p>
    </header>

    <div class="section-picker" aria-label="Pilih section cerita">
      <article
        v-for="type in STORY_SECTION_TYPES"
        :key="type"
        class="section-choice"
        :class="{ 'section-choice-active': sectionByType(type)?.enabled ?? false }"
      >
        <button
          type="button"
          class="section-choice-select"
          :aria-pressed="sectionByType(type)?.enabled ?? false"
          @click="toggleSection(type)"
        >
          <img :src="sectionImages[type]" alt="" loading="lazy">
          <span class="section-choice-copy">
            <strong>{{ sectionLabels[type] }}</strong>
            <span>{{ sectionDescriptions[type] }}</span>
          </span>
          <span class="section-choice-state">{{ sectionByType(type)?.enabled ? 'Aktif' : 'Tambah' }}</span>
        </button>
        <button
          type="button"
          class="section-choice-preview"
          :aria-label="`Buka pratinjau besar ${sectionLabels[type]}`"
          @click="openPreview(previewConfig(type))"
        ><AppIcon name="eye" :size="17" /></button>
      </article>
    </div>

    <ol class="section-order-list" aria-label="Urutan section aktif">
      <li v-for="(section, index) in enabledSections" :key="section.id" class="section-order-item">
        <span class="section-order-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <img :src="sectionImages[section.type]" alt="" loading="lazy">
        <div class="section-order-content">
          <strong>{{ sectionLabels[section.type] }}</strong>
          <div class="section-order-options">
            <label>
              <span class="sr-only">Variasi {{ sectionLabels[section.type] }}</span>
              <select :value="section.variant" @change="updateVariant(section, $event)">
                <option v-for="variant in storySectionVariants[section.type]" :key="variant" :value="variant">
                  {{ variantLabels[variant] ?? variant }}
                </option>
              </select>
            </label>
            <label>
              <span class="sr-only">Animasi masuk {{ sectionLabels[section.type] }}</span>
              <select :value="section.animation.entrance" @change="updateEntrance(section, $event)">
                <option v-for="entrance in entranceOptions" :key="entrance" :value="entrance">
                  {{ entranceLabels[entrance] }}
                </option>
              </select>
            </label>
            <label>
              <span class="sr-only">Efek scroll {{ sectionLabels[section.type] }}</span>
              <select :value="section.animation.scroll" @change="updateScroll(section, $event)">
                <option v-for="effect in scrollOptions" :key="effect" :value="effect">
                  {{ scrollLabels[effect] }}
                </option>
              </select>
            </label>
          </div>
        </div>
        <div class="section-order-actions">
          <button
            type="button"
            :disabled="index === 0"
            :aria-label="`Naikkan ${sectionLabels[section.type]}`"
            :title="`Naikkan ${sectionLabels[section.type]}`"
            @click="moveSection(index, -1)"
          ><AppIcon name="arrow-up" :size="21" /></button>
          <button
            type="button"
            :disabled="index === enabledSections.length - 1"
            :aria-label="`Turunkan ${sectionLabels[section.type]}`"
            :title="`Turunkan ${sectionLabels[section.type]}`"
            @click="moveSection(index, 1)"
          ><AppIcon name="arrow-down" :size="21" /></button>
          <button
            type="button"
            class="section-order-preview"
            :aria-label="`Pratinjau besar ${sectionLabels[section.type]}`"
            @click="openPreview(section)"
          ><AppIcon name="eye" :size="17" /></button>
        </div>
      </li>
    </ol>

    <StorySectionPreviewDialog
      v-model:open="previewOpen"
      :story="story"
      :section="previewSection"
      :section-label="previewSection ? sectionLabels[previewSection.type] : ''"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  STORY_SECTION_TYPES,
  createDefaultSectionConfig,
  sortStorySections,
  storySectionVariants,
  type StorySectionConfig,
  type StorySectionEntrance,
  type StorySectionScrollEffect,
  type StorySectionType,
} from '#shared/story-sections'
import type { StoryContent } from '#shared/schema/story'
import type { StoryTemplateId } from '#shared/story-templates'
import StorySectionPreviewDialog from '~/components/story-editor/StorySectionPreviewDialog.vue'

const props = defineProps<{
  modelValue: StorySectionConfig[]
  templateId: StoryTemplateId
  story: StoryContent
}>()
const emit = defineEmits<{
  'update:modelValue': [sections: StorySectionConfig[]]
}>()

const entranceOptions: readonly StorySectionEntrance[] = ['fade-up', 'slide-left', 'slide-right', 'zoom']
const scrollOptions: readonly StorySectionScrollEffect[] = ['none', 'parallax', 'fade']
const sectionLabels: Record<StorySectionType, string> = {
  hero: 'Sampul',
  greeting: 'Kartu ucapan',
  'first-encounter': 'Pertemuan pertama',
  gallery: 'Galeri',
  'moments-in-motion': 'Momen bergerak',
  music: 'Musik',
  timeline: 'Garis waktu',
  'love-notes': 'Catatan cinta',
  constellation: 'Konstelasi',
  'distance-map': 'Peta perjalanan',
  'future-dreams': 'Rencana bersama',
  countdown: 'Hitung mundur',
  'memory-capsule': 'Kapsul kenangan',
  book: 'Buku cerita',
  finale: 'Penutup',
}
const variantLabels: Record<string, string> = {
  'cover-story': 'Sampul editorial',
  'cinema-poster': 'Poster sinema',
  'field-notes': 'Catatan alam',
  'letter-cover': 'Sampul surat',
  'atlas-cover': 'Sampul atlas',
  letter: 'Surat personal',
  'film-scene': 'Adegan film',
  'journal-entry': 'Entri jurnal',
  'love-letter': 'Surat cinta',
  'travel-note': 'Catatan perjalanan',
  editorial: 'Editorial',
  cinematic: 'Sinematik',
  'field-note': 'Catatan lapangan',
  'first-meeting': 'Pertemuan pertama',
  'map-pin': 'Titik lokasi',
  'photo-wall': 'Dinding foto',
  'film-strip': 'Potongan film',
  'specimen-grid': 'Grid spesimen',
  polaroid: 'Polaroid',
  archive: 'Arsip',
  'scrapbook': 'Buku tempel',
  'travel-film': 'Film perjalanan',
  'player-card': 'Kartu pemutar',
  soundtrack: 'Soundtrack',
  'listening-note': 'Catatan musik',
  vertical: 'Vertikal',
  'observation-log': 'Catatan observasi',
  'chapter-ledger': 'Daftar bab',
  'route-log': 'Catatan rute',
  letters: 'Surat-surat',
  'notes-wall': 'Dinding catatan',
  postcards: 'Kartu pos',
  'night-sky': 'Langit malam',
  'star-map': 'Peta bintang',
  'memory-orbit': 'Orbit kenangan',
  route: 'Rute perjalanan',
  coordinates: 'Koordinat',
  'wish-list': 'Daftar harapan',
  horizon: 'Cakrawala',
  'shared-plan': 'Rencana bersama',
  minimal: 'Minimal',
  calendar: 'Kalender',
  anniversary: 'Hari jadi',
  'sealed-letter': 'Surat tersegel',
  'time-lock': 'Kunci waktu',
  keepsake: 'Kenang-kenangan',
  'open-book': 'Buku terbuka',
  'feature-book': 'Buku sinematik',
  journal: 'Jurnal',
  'travel-journal': 'Jurnal perjalanan',
  'closing-letter': 'Surat penutup',
  credits: 'Kredit film',
  'last-page': 'Halaman terakhir',
  'sealed-note': 'Catatan tersegel',
  'closing-coordinates': 'Koordinat penutup',
}
const sectionDescriptions: Record<StorySectionType, string> = {
  hero: 'Kenalkan cerita dan foto sampul.',
  greeting: 'Pesan personal untuk pasangan.',
  'first-encounter': 'Ceritakan awal pertemuan.',
  gallery: 'Pilih dan susun foto kenangan.',
  'moments-in-motion': 'Tambahkan video kenangan.',
  music: 'Pilih lagu yang mewakili kalian.',
  timeline: 'Rangkai momen berdasarkan waktu.',
  'love-notes': 'Kumpulan pesan singkat.',
  constellation: 'Kenangan seperti rasi bintang.',
  'distance-map': 'Tampilkan rute perjalanan.',
  'future-dreams': 'Daftar rencana bersama.',
  countdown: 'Hitung hari menuju momen spesial.',
  'memory-capsule': 'Pesan untuk dibuka nanti.',
  book: 'Buku interaktif berisi bab cerita.',
  finale: 'Tutup cerita dengan pesan.',
}
const sectionImages: Record<StorySectionType, string> = {
  hero: '/previews/cover.svg',
  greeting: '/previews/greeting.svg',
  'first-encounter': '/previews/first-meeting.svg',
  gallery: '/previews/city.svg',
  'moments-in-motion': '/previews/journey.svg',
  music: '/previews/sunset.svg',
  timeline: '/previews/journey.svg',
  'love-notes': '/previews/finale.svg',
  constellation: '/previews/garden.svg',
  'distance-map': '/previews/city.svg',
  'future-dreams': '/previews/garden.svg',
  countdown: '/previews/sunset.svg',
  'memory-capsule': '/previews/cover.svg',
  book: '/previews/cover.svg',
  finale: '/previews/finale.svg',
}
const entranceLabels: Record<StorySectionEntrance, string> = {
  'fade-up': 'Muncul lembut',
  'slide-left': 'Geser dari kiri',
  'slide-right': 'Geser dari kanan',
  zoom: 'Zoom halus',
}
const scrollLabels: Record<StorySectionScrollEffect, string> = {
  none: 'Tanpa efek scroll',
  parallax: 'Parallax lembut',
  fade: 'Fade saat scroll',
}

const enabledSections = computed(() => sortStorySections(props.modelValue))
const previewSection = ref<StorySectionConfig | null>(null)
const previewOpen = ref(false)

function sectionByType(type: StorySectionType): StorySectionConfig | undefined {
  return props.modelValue.find(section => section.type === type)
}

function previewConfig(type: StorySectionType): StorySectionConfig {
  return sectionByType(type) ?? createDefaultSectionConfig(type, 0)
}

function openPreview(section: StorySectionConfig): void {
  previewSection.value = section
  previewOpen.value = true
}

function publish(sections: StorySectionConfig[]): void {
  const orderById = new Map(sortStorySections(sections).map((section, order) => [section.id, order]))
  emit('update:modelValue', sections.map(section => {
    const order = orderById.get(section.id)
    return order === undefined ? section : { ...section, order }
  }))
}

function toggleSection(type: StorySectionType): void {
  const enabled = !(sectionByType(type)?.enabled ?? false)
  const existing = sectionByType(type)
  const activeCount = enabledSections.value.length
  const next = existing
    ? props.modelValue.map(section => section.type === type
        ? { ...section, enabled, order: enabled ? activeCount : section.order }
        : section)
    : [...props.modelValue, createDefaultSectionConfig(type, activeCount)]
  publish(next)
}

function updateVariant(section: StorySectionConfig, event: Event): void {
  const select = event.currentTarget
  if (!(select instanceof HTMLSelectElement)) return
  const variant = storySectionVariants[section.type].find(option => option === select.value)
  if (!variant) return
  publish(props.modelValue.map(item => item.id === section.id ? { ...item, variant } : item))
}

function updateEntrance(section: StorySectionConfig, event: Event): void {
  const select = event.currentTarget
  if (!(select instanceof HTMLSelectElement)) return
  const entrance = entranceOptions.find(option => option === select.value)
  if (!entrance) return
  publish(props.modelValue.map(item => item.id === section.id
    ? { ...item, animation: { ...item.animation, entrance } }
    : item))
}

function updateScroll(section: StorySectionConfig, event: Event): void {
  const select = event.currentTarget
  if (!(select instanceof HTMLSelectElement)) return
  const scroll = scrollOptions.find(option => option === select.value)
  if (!scroll) return
  publish(props.modelValue.map(item => item.id === section.id
    ? { ...item, animation: { ...item.animation, scroll } }
    : item))
}

function moveSection(index: number, direction: -1 | 1): void {
  const next = [...enabledSections.value]
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= next.length) return
  const [moved] = next.splice(index, 1)
  if (!moved) return
  next.splice(targetIndex, 0, moved)
  const orderById = new Map(next.map((section, order) => [section.id, order]))
  publish(props.modelValue.map(section => {
    const order = orderById.get(section.id)
    return order === undefined ? section : { ...section, order }
  }))
}
</script>

<style scoped>
.section-editor {
  display: grid;
  gap: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  padding: clamp(1rem, 3vw, 1.5rem);
  background: var(--color-surface);
}

.section-editor-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem;
}

.section-editor-heading h3 {
  margin: 0.3rem 0 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.45rem, 4vw, 2rem);
  font-weight: 400;
}

.section-editor-heading > p,
.section-editor-kicker {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: 0.72rem;
}

.section-editor-kicker {
  color: var(--color-primary);
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.section-picker {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 0.7rem;
}

.section-choice {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  background: var(--color-surface);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.section-choice-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.section-choice-select {
  display: grid;
  width: 100%;
  min-height: 6rem;
  grid-template-columns: 4.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  border: 0;
  padding: 0.65rem 2.8rem 0.65rem 0.65rem;
  color: var(--color-foreground);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.section-choice-select:focus-visible,
.section-choice-preview:focus-visible,
.section-order-actions button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -3px;
}

.section-choice-select img,
.section-order-item > img {
  display: block;
  width: 100%;
  height: 3.8rem;
  border-radius: var(--radius-small);
  object-fit: cover;
}

.section-choice-copy {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.section-choice-copy strong {
  font-size: 0.8rem;
}

.section-choice-copy > span {
  color: var(--color-muted-foreground);
  font-size: 0.65rem;
  line-height: 1.4;
}

.section-choice-state {
  color: var(--color-primary);
  font-size: 0.62rem;
  font-weight: 700;
}

.section-choice-preview {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-primary);
  background: var(--color-surface);
  cursor: pointer;
}

.section-order-list {
  display: grid;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.section-order-item {
  display: grid;
  grid-template-columns: 2rem 4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.7rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 0;
}

.section-order-item > img {
  height: 3rem;
}

.section-order-number {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 10%, white);
  font-size: 0.68rem;
  font-weight: 700;
}

.section-order-content {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 0.45rem;
  font-size: 0.78rem;
}

.section-order-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.section-order-options select {
  max-width: 100%;
  min-height: 2.2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-small);
  padding: 0.35rem 1.7rem 0.35rem 0.55rem;
  color: var(--color-foreground);
  background: var(--color-surface);
  font-size: 0.68rem;
}

.section-order-actions {
  display: grid;
  gap: 0.35rem;
}

.section-order-actions button {
  display: grid;
  width: 2.85rem;
  height: 2.85rem;
  place-items: center;
  border: 1px solid color-mix(in srgb, var(--color-primary) 38%, var(--color-border));
  border-radius: 0.85rem;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 7%, var(--color-surface));
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.section-order-actions button:not(:disabled):hover {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
  transform: translateY(-1px);
}

.section-order-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.section-order-preview {
  margin-top: 0.25rem;
}

.section-order-options select:focus-visible,
.section-choice-preview:focus-visible,
.section-order-actions button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (max-width: 540px) {
  .section-order-item {
    grid-template-columns: 1.75rem 3.5rem minmax(0, 1fr) auto;
    gap: 0.45rem;
  }

  .section-order-item > img {
    height: 2.7rem;
  }

  .section-order-actions {
    grid-template-columns: repeat(3, 2.45rem);
    gap: 0.2rem;
  }

  .section-order-actions button {
    width: 2.65rem;
    height: 2.65rem;
    margin: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-choice,
  .section-order-actions button {
    transition: none;
  }
}
</style>
