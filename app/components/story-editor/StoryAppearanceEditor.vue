<script setup lang="ts">
import {
  getStoryAppearanceCssVariables,
  STORY_FONT_OPTIONS,
  type StoryAppearance,
} from '#shared/story-appearance'

const appearance = defineModel<StoryAppearance>({ required: true })
const fontOptions = [
  { id: 'instrument-serif', ...STORY_FONT_OPTIONS['instrument-serif'] },
  { id: 'dm-sans', ...STORY_FONT_OPTIONS['dm-sans'] },
  { id: 'space-grotesk', ...STORY_FONT_OPTIONS['space-grotesk'] },
] as const
const previewStyle = computed(() => getStoryAppearanceCssVariables(appearance.value))

function updateColor(
  key: 'backgroundColor' | 'accentColor' | 'surfaceColor' | 'textColor',
  event: Event,
): void {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  appearance.value = { ...appearance.value, [key]: event.currentTarget.value }
}

function updateFont(key: 'displayFont' | 'bodyFont', event: Event): void {
  if (!(event.currentTarget instanceof HTMLSelectElement)) return
  const value = event.currentTarget.value
  if (value !== 'instrument-serif' && value !== 'dm-sans' && value !== 'space-grotesk') return
  appearance.value = {
    ...appearance.value,
    [key]: value,
  }
}
</script>

<template>
  <section class="story-appearance-editor" aria-labelledby="story-appearance-title">
    <header class="appearance-heading">
      <div>
        <p class="appearance-kicker">Warna & tipografi</p>
        <h3 id="story-appearance-title">Atur identitas visual cerita</h3>
        <p>Warna dan font awal mengikuti template. Perubahan ini diterapkan ke seluruh section.</p>
      </div>
    </header>

    <div class="appearance-grid">
      <label class="appearance-control">
        <span>Warna latar utama</span>
        <span class="appearance-color-input">
          <input
            :value="appearance.backgroundColor"
            type="color"
            aria-label="Warna latar utama"
            @input="updateColor('backgroundColor', $event)"
          >
          <code>{{ appearance.backgroundColor }}</code>
        </span>
      </label>
      <label class="appearance-control">
        <span>Warna aksen</span>
        <span class="appearance-color-input">
          <input
            :value="appearance.accentColor"
            type="color"
            aria-label="Warna aksen"
            @input="updateColor('accentColor', $event)"
          >
          <code>{{ appearance.accentColor }}</code>
        </span>
      </label>
      <label class="appearance-control">
        <span>Warna permukaan</span>
        <span class="appearance-color-input">
          <input
            :value="appearance.surfaceColor"
            type="color"
            aria-label="Warna permukaan"
            @input="updateColor('surfaceColor', $event)"
          >
          <code>{{ appearance.surfaceColor }}</code>
        </span>
      </label>
      <label class="appearance-control">
        <span>Warna teks</span>
        <span class="appearance-color-input">
          <input
            :value="appearance.textColor"
            type="color"
            aria-label="Warna teks"
            @input="updateColor('textColor', $event)"
          >
          <code>{{ appearance.textColor }}</code>
        </span>
      </label>
      <label class="appearance-control">
        <span>Font judul</span>
        <select :value="appearance.displayFont" @change="updateFont('displayFont', $event)">
          <option v-for="font in fontOptions" :key="font.id" :value="font.id">{{ font.label }}</option>
        </select>
      </label>
      <label class="appearance-control">
        <span>Font isi</span>
        <select :value="appearance.bodyFont" @change="updateFont('bodyFont', $event)">
          <option v-for="font in fontOptions" :key="font.id" :value="font.id">{{ font.label }}</option>
        </select>
      </label>
    </div>

    <div class="appearance-sample" :style="previewStyle">
      <span>Pratinjau tema</span>
      <strong>Untuk cerita kalian</strong>
      <p>Font dan warna ini akan mengikuti seluruh halaman cerita.</p>
      <span class="appearance-sample-accent">Aksen pilihan</span>
    </div>
  </section>
</template>

<style scoped>
.story-appearance-editor {
  display: grid;
  gap: 1.25rem;
}

.appearance-heading h3 {
  margin: 0.25rem 0;
  font-family: var(--font-family-display);
  font-size: 1.65rem;
}

.appearance-heading p:last-child {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: 0.875rem;
  line-height: 1.55;
}

.appearance-kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.appearance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 0.75rem;
}

.appearance-control {
  display: grid;
  min-width: 0;
  gap: 0.45rem;
  color: var(--color-foreground);
  font-size: 0.8rem;
  font-weight: 600;
}

.appearance-control select,
.appearance-color-input {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding: 0.45rem 0.65rem;
  background: var(--color-surface);
}

.appearance-control select {
  width: 100%;
  color: var(--color-foreground);
}

.appearance-color-input input {
  width: 2.2rem;
  height: 2rem;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.appearance-color-input code {
  color: var(--color-muted-foreground);
  font-size: 0.75rem;
}

.appearance-sample {
  display: grid;
  gap: 0.3rem;
  border: 1px solid color-mix(in srgb, var(--story-accent-color), transparent 65%);
  border-radius: var(--radius-large);
  padding: 1rem 1.25rem;
  color: var(--story-text-color);
  background: var(--story-background-color);
}

.appearance-sample > span:first-child,
.appearance-sample p {
  margin: 0;
  font-family: var(--story-font-body);
  font-size: 0.75rem;
}

.appearance-sample strong {
  font-family: var(--story-font-display);
  font-size: 1.5rem;
  font-weight: 400;
}

.appearance-sample p {
  line-height: 1.5;
}

.appearance-sample .appearance-sample-accent {
  width: fit-content;
  margin-top: 0.25rem;
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  color: var(--story-accent-contrast-color);
  background: var(--story-accent-color);
}
</style>
