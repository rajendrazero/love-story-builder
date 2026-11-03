<template>
  <section class="section-content-editor" aria-labelledby="section-content-editor-title">
    <div>
      <p class="section-content-kicker">Konten tambahan</p>
      <h3 id="section-content-editor-title">Isi section pilihanmu</h3>
      <p class="section-content-help">Bagian kosong boleh dilewati. Section yang diaktifkan harus memiliki konten.</p>
    </div>

    <div class="section-content-grid">
      <label class="floating-field">
        <span class="editor-label">Catatan cinta · satu catatan per baris</span>
        <textarea v-model="loveNotesText" class="editor-input min-h-28" maxlength="6000" placeholder="Terima kasih sudah menjadi rumah&#10;Aku memilihmu, setiap hari" />
      </label>
      <label class="floating-field">
        <span class="editor-label">Rencana bersama · satu rencana per baris</span>
        <textarea v-model="futureDreamsText" class="editor-input min-h-28" maxlength="3000" placeholder="Melihat matahari terbit bersama&#10;Membuat rumah kecil dengan taman" />
      </label>

      <label class="floating-field">
        <span class="editor-label">Titik awal perjalanan</span>
        <input :value="sectionContent.distanceMap?.origin ?? ''" class="editor-input" maxlength="120" placeholder="Kota tempat kita bertemu" @input="updateDistance('origin', $event)">
      </label>
      <label class="floating-field">
        <span class="editor-label">Tujuan perjalanan</span>
        <input :value="sectionContent.distanceMap?.destination ?? ''" class="editor-input" maxlength="120" placeholder="Tempat yang ingin kita datangi" @input="updateDistance('destination', $event)">
      </label>
      <label class="floating-field md:col-span-2">
        <span class="editor-label">Catatan perjalanan</span>
        <textarea :value="sectionContent.distanceMap?.note ?? ''" class="editor-input min-h-24" maxlength="500" placeholder="Sejauh apa pun, kita selalu menemukan jalan pulang." @input="updateDistance('note', $event)" />
      </label>

      <label class="floating-field">
        <span class="editor-label">Judul hitung mundur</span>
        <input :value="sectionContent.countdown?.title ?? ''" class="editor-input" maxlength="120" placeholder="Hari jadi kita berikutnya" @input="updateCountdown('title', $event)">
      </label>
      <label class="floating-field">
        <span class="editor-label">Tanggal hitung mundur</span>
        <input :value="sectionContent.countdown?.targetDate ?? ''" class="editor-input" type="date" @input="updateCountdown('targetDate', $event)">
      </label>

      <label class="floating-field">
        <span class="editor-label">Judul kapsul kenangan</span>
        <input :value="sectionContent.memoryCapsule?.title ?? ''" class="editor-input" maxlength="120" placeholder="Untuk kita di masa depan" @input="updateCapsule('title', $event)">
      </label>
      <label class="floating-field">
        <span class="editor-label">Tanggal kapsul dapat dibuka</span>
        <input :value="sectionContent.memoryCapsule?.unlockDate ?? ''" class="editor-input" type="date" @input="updateCapsule('unlockDate', $event)">
      </label>
      <label class="floating-field md:col-span-2">
        <span class="editor-label">Isi kapsul kenangan</span>
        <textarea :value="sectionContent.memoryCapsule?.message ?? ''" class="editor-input min-h-32" maxlength="2000" placeholder="Sebuah pesan untuk dibaca bersama pada waktunya." @input="updateCapsule('message', $event)" />
        <span class="text-xs text-muted">Pesan kapsul yang belum waktunya dibuka tidak dikirim ke pengunjung.</span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StorySectionContent } from '#shared/story-sections'

const model = defineModel<StorySectionContent>({ required: true })
const sectionContent = computed(() => model.value)
const loveNotesText = computed({
  get: () => (model.value.loveNotes ?? []).join('\n'),
  set: (value: string) => {
    model.value = {
      ...model.value,
      loveNotes: parseLines(value, 500),
    }
  },
})
const futureDreamsText = computed({
  get: () => (model.value.futureDreams ?? []).join('\n'),
  set: (value: string) => {
    model.value = {
      ...model.value,
      futureDreams: parseLines(value, 240),
    }
  },
})

function parseLines(value: string, limit: number): string[] {
  return value.split(/\r?\n/).map(line => line.slice(0, limit)).slice(0, 12)
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

@media (max-width: 640px) {
  .section-content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
