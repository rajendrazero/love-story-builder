<template>
  <section class="section-content-editor" aria-labelledby="section-content-editor-title">
    <div>
      <p class="section-content-kicker">Konten tambahan</p>
      <h3 id="section-content-editor-title">Isi section pilihanmu</h3>
      <p class="section-content-help">Bagian kosong boleh dilewati. Section yang diaktifkan harus memiliki konten.</p>
    </div>

    <div class="section-content-grid">
      <div v-if="sectionType === 'love-notes'" class="repeatable-list md:col-span-2">
        <div class="repeatable-list-heading">
          <div>
            <p class="editor-label">Catatan cinta</p>
            <p class="repeatable-list-help">Tambahkan beberapa pesan singkat, maksimal 12 catatan.</p>
          </div>
          <span class="repeatable-list-count">{{ loveNotes.length }}/12</span>
        </div>
        <p v-if="!loveNotes.length" class="repeatable-list-empty">Belum ada catatan. Tambahkan catatan pertama kalian.</p>
        <div v-for="(note, index) in loveNotes" :key="`love-note-${index}`" class="repeatable-list-row">
          <label class="floating-field">
            <span class="editor-label">Catatan cinta {{ index + 1 }}</span>
            <input
              :value="note"
              class="editor-input"
              maxlength="500"
              :aria-label="`Catatan cinta ${index + 1}`"
              placeholder="Terima kasih sudah menjadi rumah untukku."
              @input="updateListItem('loveNotes', index, $event)"
            >
          </label>
          <button
            type="button"
            class="repeatable-list-remove"
            :aria-label="`Hapus catatan cinta ${index + 1}`"
            @click="removeListItem('loveNotes', index)"
          ><AppIcon name="trash" :size="17" /><span>Hapus</span></button>
        </div>
        <button
          type="button"
          class="repeatable-list-add"
          :disabled="loveNotes.length >= 12"
          @click="addListItem('loveNotes')"
        ><AppIcon name="plus" :size="17" />Tambah catatan</button>
      </div>

      <div v-if="sectionType === 'future-dreams'" class="repeatable-list md:col-span-2">
        <div class="repeatable-list-heading">
          <div>
            <p class="editor-label">Rencana bersama</p>
            <p class="repeatable-list-help">Satu impian per kolom, maksimal 12 rencana.</p>
          </div>
          <span class="repeatable-list-count">{{ futureDreams.length }}/12</span>
        </div>
        <p v-if="!futureDreams.length" class="repeatable-list-empty">Belum ada rencana. Tambahkan hal yang ingin kalian lakukan bersama.</p>
        <div v-for="(dream, index) in futureDreams" :key="`future-dream-${index}`" class="repeatable-list-row">
          <label class="floating-field">
            <span class="editor-label">Rencana bersama {{ index + 1 }}</span>
            <input
              :value="dream"
              class="editor-input"
              maxlength="240"
              :aria-label="`Rencana bersama ${index + 1}`"
              placeholder="Melihat matahari terbit bersama."
              @input="updateListItem('futureDreams', index, $event)"
            >
          </label>
          <button
            type="button"
            class="repeatable-list-remove"
            :aria-label="`Hapus rencana bersama ${index + 1}`"
            @click="removeListItem('futureDreams', index)"
          ><AppIcon name="trash" :size="17" /><span>Hapus</span></button>
        </div>
        <button
          type="button"
          class="repeatable-list-add"
          :disabled="futureDreams.length >= 12"
          @click="addListItem('futureDreams')"
        ><AppIcon name="plus" :size="17" />Tambah rencana</button>
      </div>

      <label v-if="sectionType === 'distance-map'" class="floating-field">
        <span class="editor-label">Titik awal perjalanan</span>
        <input :value="sectionContent.distanceMap?.origin ?? ''" class="editor-input" maxlength="120" placeholder="Kota tempat kita bertemu" @input="updateDistance('origin', $event)">
      </label>
      <label v-if="sectionType === 'distance-map'" class="floating-field">
        <span class="editor-label">Tujuan perjalanan</span>
        <input :value="sectionContent.distanceMap?.destination ?? ''" class="editor-input" maxlength="120" placeholder="Tempat yang ingin kita datangi" @input="updateDistance('destination', $event)">
      </label>
      <label v-if="sectionType === 'distance-map'" class="floating-field md:col-span-2">
        <span class="editor-label">Catatan perjalanan</span>
        <textarea :value="sectionContent.distanceMap?.note ?? ''" class="editor-input min-h-24" maxlength="500" placeholder="Sejauh apa pun, kita selalu menemukan jalan pulang." @input="updateDistance('note', $event)" />
      </label>

      <label v-if="sectionType === 'countdown'" class="floating-field">
        <span class="editor-label">Judul hitung mundur</span>
        <input :value="sectionContent.countdown?.title ?? ''" class="editor-input" maxlength="120" placeholder="Hari jadi kita berikutnya" @input="updateCountdown('title', $event)">
      </label>
      <label v-if="sectionType === 'countdown'" class="floating-field">
        <span class="editor-label">Tanggal hitung mundur</span>
        <input :value="sectionContent.countdown?.targetDate ?? ''" class="editor-input" type="date" @input="updateCountdown('targetDate', $event)">
      </label>

      <label v-if="sectionType === 'memory-capsule'" class="floating-field">
        <span class="editor-label">Judul kapsul kenangan</span>
        <input :value="sectionContent.memoryCapsule?.title ?? ''" class="editor-input" maxlength="120" placeholder="Untuk kita di masa depan" @input="updateCapsule('title', $event)">
      </label>
      <label v-if="sectionType === 'memory-capsule'" class="floating-field">
        <span class="editor-label">Tanggal kapsul dapat dibuka</span>
        <input :value="sectionContent.memoryCapsule?.unlockDate ?? ''" class="editor-input" type="date" @input="updateCapsule('unlockDate', $event)">
      </label>
      <label v-if="sectionType === 'memory-capsule'" class="floating-field md:col-span-2">
        <span class="editor-label">Isi kapsul kenangan</span>
        <textarea :value="sectionContent.memoryCapsule?.message ?? ''" class="editor-input min-h-32" maxlength="2000" placeholder="Sebuah pesan untuk dibaca bersama pada waktunya." @input="updateCapsule('message', $event)" />
        <span class="text-xs text-muted">Pesan kapsul yang belum waktunya dibuka tidak dikirim ke pengunjung.</span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StorySectionContent, StorySectionType } from '#shared/story-sections'

defineProps<{ sectionType: StorySectionType }>()
const model = defineModel<StorySectionContent>({ required: true })
const sectionContent = computed(() => model.value)
const loveNotes = computed(() => model.value.loveNotes ?? [])
const futureDreams = computed(() => model.value.futureDreams ?? [])

type RepeatableListField = 'loveNotes' | 'futureDreams'

function updateListItem(field: RepeatableListField, index: number, event: Event): void {
  const value = inputValue(event)
  const items = [...(model.value[field] ?? [])]
  if (value === undefined || index < 0 || index >= items.length) return
  items[index] = value
  model.value = { ...model.value, [field]: items }
}

function addListItem(field: RepeatableListField): void {
  const items = [...(model.value[field] ?? [])]
  if (items.length >= 12) return
  items.push('')
  model.value = { ...model.value, [field]: items }
}

function removeListItem(field: RepeatableListField, index: number): void {
  const items = [...(model.value[field] ?? [])]
  if (index < 0 || index >= items.length) return
  items.splice(index, 1)
  model.value = { ...model.value, [field]: items }
}

function inputValue(event: Event): string | undefined {
  const input = event.currentTarget
  return input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement
    ? input.value
    : undefined
}

function updateDistance(
  field: 'origin' | 'destination' | 'note',
  event: Event,
): void {
  const value = inputValue(event)
  if (value === undefined) return
  model.value = {
    ...model.value,
    distanceMap: { ...model.value.distanceMap, [field]: value },
  }
}

function updateCountdown(field: 'title' | 'targetDate', event: Event): void {
  const value = inputValue(event)
  if (value === undefined) return
  model.value = {
    ...model.value,
    countdown: { ...model.value.countdown, [field]: value },
  }
}

function updateCapsule(
  field: 'title' | 'unlockDate' | 'message',
  event: Event,
): void {
  const value = inputValue(event)
  if (value === undefined) return
  model.value = {
    ...model.value,
    memoryCapsule: { ...model.value.memoryCapsule, [field]: value },
  }
}
</script>

<style scoped>
.section-content-editor {
  display: grid;
  gap: 1.25rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}

.section-content-editor h3 {
  margin: 0.3rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.45rem, 4vw, 2rem);
  font-weight: 400;
}

.section-content-kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.section-content-help {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: 0.78rem;
  line-height: 1.5;
}

.section-content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.repeatable-list {
  display: grid;
  gap: 0.85rem;
}

.repeatable-list-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 1rem;
}

.repeatable-list-heading .editor-label {
  display: block;
  margin: 0;
  color: var(--color-foreground);
  font-size: 0.85rem;
  font-weight: 600;
}

.repeatable-list-help,
.repeatable-list-empty {
  margin: 0.35rem 0 0;
  color: var(--color-muted-foreground);
  font-size: 0.75rem;
  line-height: 1.5;
}

.repeatable-list-count {
  flex: 0 0 auto;
  color: var(--color-muted-foreground);
  font-size: 0.75rem;
}

.repeatable-list-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 0.75rem;
}

.repeatable-list-remove,
.repeatable-list-add {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  color: var(--color-primary);
  background: var(--color-surface);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.repeatable-list-remove {
  margin-bottom: 0.1rem;
}

.repeatable-list-add {
  width: fit-content;
  border-color: var(--color-primary);
}

.repeatable-list-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.repeatable-list-remove:focus-visible,
.repeatable-list-add:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .section-content-grid {
    grid-template-columns: 1fr;
  }

  .repeatable-list-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .repeatable-list-remove {
    justify-self: end;
    margin-bottom: 0;
  }
}
</style>
