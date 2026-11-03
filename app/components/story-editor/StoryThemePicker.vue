<script setup lang="ts">
import {
  availableStoryTemplates,
  type StoryTemplateId,
} from '#shared/story-templates'

const props = defineProps<{
  modelValue: StoryTemplateId
}>()
const emit = defineEmits<{
  'update:modelValue': [templateId: StoryTemplateId]
}>()

function selectTemplate(templateId: StoryTemplateId): void {
  if (templateId !== props.modelValue) emit('update:modelValue', templateId)
}
</script>

<template>
  <section class="theme-picker" aria-labelledby="theme-picker-title">
    <header class="theme-picker-heading">
      <p class="theme-picker-kicker">01 · Tentukan suasana</p>
      <h3 id="theme-picker-title">Pilih tema cerita</h3>
      <p>Warna dan pasangan font langsung mengikuti tema. Mengganti tema mengatur ulang section ke susunan bawaan tema, tanpa menghapus isi cerita.</p>
    </header>

    <div class="theme-picker-grid">
      <article
        v-for="template in availableStoryTemplates"
        :key="template.id"
        class="theme-card"
        :class="{ 'theme-card-active': modelValue === template.id }"
        :style="{
          '--theme-paper': template.colors[0],
          '--theme-accent': template.colors[1],
          '--theme-ink': template.colors[2],
        }"
      >
        <button
          type="button"
          class="theme-card-select"
          :aria-pressed="modelValue === template.id"
          @click="selectTemplate(template.id)"
        >
          <span class="theme-card-colors" aria-label="Palet warna tema">
            <span v-for="(color, index) in template.colors" :key="color" :style="{ backgroundColor: color }">
              <span class="sr-only">{{ ['Warna latar', 'Warna aksen', 'Warna teks'][index] }} {{ color }}</span>
            </span>
          </span>
          <span class="theme-card-copy">
            <strong>{{ template.name }}</strong>
            <span>{{ template.mood }}</span>
          </span>
          <span
            class="theme-card-sample"
            :class="`theme-card-sample-${template.id}`"
            aria-hidden="true"
          >
            <span>Our little story</span>
            <strong>Untuk selamanya.</strong>
          </span>
          <span class="theme-card-font">{{ template.fontPair }}</span>
          <span v-if="modelValue === template.id" class="theme-card-selected">Tema dipilih</span>
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.theme-picker {
  display: grid;
  gap: 1.25rem;
}

.theme-picker-heading {
  max-width: 46rem;
}

.theme-picker-kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.theme-picker-heading h3 {
  margin: 0.35rem 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  font-weight: 400;
}

.theme-picker-heading > p:last-child {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: 0.82rem;
  line-height: 1.6;
}

.theme-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.85rem;
}

.theme-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.theme-card:hover {
  transform: translateY(-2px);
}

.theme-card-active {
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 2px var(--theme-accent);
}

.theme-card-select {
  display: grid;
  width: 100%;
  min-height: 11rem;
  gap: 0.7rem;
  border: 0;
  padding: 0.85rem;
  color: var(--color-foreground);
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.theme-card-select:focus-visible {
  outline: 3px solid var(--theme-accent);
  outline-offset: -4px;
}

.theme-card-colors {
  display: flex;
  height: 2rem;
  gap: 0.35rem;
}

.theme-card-colors > span {
  flex: 1;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: var(--radius-small);
}

.theme-card-copy {
  display: grid;
  gap: 0.2rem;
}

.theme-card-copy strong {
  font-family: 'Instrument Serif', serif;
  font-size: 1.3rem;
  font-weight: 400;
}

.theme-card-copy > span,
.theme-card-font {
  color: var(--color-muted-foreground);
  font-size: 0.7rem;
}

.theme-card-sample {
  display: grid;
  min-height: 4.5rem;
  align-content: center;
  gap: 0.15rem;
  border-radius: var(--radius-medium);
  padding: 0.65rem 0.85rem;
  color: var(--theme-ink);
  background: var(--theme-paper);
}

.theme-card-sample > span {
  color: var(--theme-accent);
  font-size: 0.58rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.theme-card-sample strong {
  font-family: 'Instrument Serif', serif;
  font-size: 1.25rem;
  font-weight: 400;
}

.theme-card-sample-midnight-cinema {
  color: #f2eaf7;
}

.theme-card-sample-midnight-cinema strong {
  color: var(--theme-paper);
}

.theme-card-font {
  align-self: end;
}

.theme-card-selected {
  color: var(--theme-accent);
  font-size: 0.7rem;
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .theme-card {
    transition: none;
  }

  .theme-card:hover {
    transform: none;
  }
}
</style>
