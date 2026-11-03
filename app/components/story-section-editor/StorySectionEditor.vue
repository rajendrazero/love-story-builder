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
      <label v-for="type in STORY_SECTION_TYPES" :key="type" class="section-picker-option">
        <input
          type="checkbox"
          :checked="sectionByType(type)?.enabled ?? false"
          @change="toggleSection(type, $event)"
        >
        <span>{{ sectionLabels[type] }}</span>
      </label>
    </div>

    <ol class="section-order-list" aria-label="Urutan section aktif">
      <li v-for="(section, index) in enabledSections" :key="section.id" class="section-order-item">
        <span class="section-order-number">{{ String(index + 1).padStart(2, '0') }}</span>
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
            @click="moveSection(index, -1)"
          ><AppIcon name="chevron-up" :size="17" /></button>
          <button
            type="button"
            :disabled="index === enabledSections.length - 1"
            :aria-label="`Turunkan ${sectionLabels[section.type]}`"
            @click="moveSection(index, 1)"
          ><AppIcon name="chevron-down" :size="17" /></button>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

const props = defineProps<{
  modelValue: StorySectionConfig[]
  templateId: string
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

function sectionByType(type: StorySectionType): StorySectionConfig | undefined {
  return props.modelValue.find(section => section.type === type)
}

function publish(sections: StorySectionConfig[]): void {
  const orderById = new Map(sortStorySections(sections).map((section, order) => [section.id, order]))
  emit('update:modelValue', sections.map(section => {
    const order = orderById.get(section.id)
    return order === undefined ? section : { ...section, order }
  }))
}

function toggleSection(type: StorySectionType, event: Event): void {
  const input = event.currentTarget
  if (!(input instanceof HTMLInputElement)) return
  const enabled = input.checked
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
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.5rem;
}

.section-picker-option {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding: 0.55rem 0.7rem;
  color: var(--color-foreground);
  font-size: 0.75rem;
  cursor: pointer;
}

.section-picker-option:has(input:checked) {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 7%, white);
}

.section-picker-option input {
  accent-color: var(--color-primary);
}

.section-order-list {
  display: grid;
  gap: 0.65rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.section-order-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  border-bottom: 1px solid var(--color-border);
  padding: 0.75rem 0;
}

.section-order-number {
  color: var(--color-primary);
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
  gap: 0.25rem;
}

.section-order-actions button {
  display: grid;
  width: 2.3rem;
  height: 2.3rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-primary);
  background: var(--color-surface);
}

.section-order-actions button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.section-order-actions button:focus-visible,
.section-order-options select:focus-visible,
.section-picker-option:focus-within {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
