<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  getTemplateDefinition,
  templateEntranceStyles,
  type TemplateEntranceStyle,
} from '#shared/story-templates'
import type { StoryContent } from '#shared/schema/story'
import EntranceCover from '~/components/story-experience/EntranceCover.vue'

const props = defineProps<{
  modelValue: TemplateEntranceStyle
  templateId: NonNullable<StoryContent['templateId']>
  story: Pick<StoryContent, 'coupleNames' | 'heroImage' | 'title'>
}>()
const emit = defineEmits<{
  'update:modelValue': [style: TemplateEntranceStyle]
}>()
const previewDialog = ref<HTMLDialogElement | null>(null)
const largePreviewStyle = ref<TemplateEntranceStyle | null>(null)
const placeholderImage = computed(() => getTemplateDefinition(props.templateId)?.thumbnail ?? '/previews/cover.svg')
const largePreviewStory = computed(() => createPreviewStory(largePreviewStyle.value ?? props.modelValue))

function createPreviewStory(style: TemplateEntranceStyle) {
  return {
    ...props.story,
    templateId: props.templateId,
    entranceStyle: style,
    heroImage: props.story.heroImage || placeholderImage.value,
  }
}

async function openPreview(style: TemplateEntranceStyle): Promise<void> {
  largePreviewStyle.value = style
  await nextTick()
  if (!previewDialog.value?.open) previewDialog.value?.showModal()
}

function closePreview(): void {
  if (previewDialog.value?.open) previewDialog.value.close()
}

function onDialogClose(): void {
  largePreviewStyle.value = null
}
</script>

<template>
  <section class="entrance-picker" aria-labelledby="entrance-picker-title">
    <header class="entrance-picker-heading">
      <div>
        <p class="entrance-picker-kicker">02 · Sebelum cerita dimulai</p>
        <h3 id="entrance-picker-title">Pilih layar pembuka</h3>
      </div>
      <p>Pengunjung melihat sampul ini sebelum membuka cerita. Coba tiap gaya, lalu buka pratinjau lebih besar.</p>
    </header>

    <div class="entrance-picker-grid">
      <article
        v-for="option in templateEntranceStyles"
        :key="option.style"
        class="entrance-option"
        :class="{ 'entrance-option-active': modelValue === option.style }"
      >
        <EntranceCover
          :story="createPreviewStory(option.style)"
          :preview="true"
          preview-size="small"
        />
        <div class="entrance-option-details">
          <div>
            <h4>{{ option.label }}</h4>
            <p>{{ option.description }}</p>
          </div>
          <div class="entrance-option-actions">
            <button
              type="button"
              class="entrance-select-button"
              :aria-pressed="modelValue === option.style"
              @click="emit('update:modelValue', option.style)"
            >
              {{ modelValue === option.style ? 'Dipilih' : 'Pilih' }}
            </button>
            <button
              type="button"
              class="entrance-preview-button"
              :aria-label="`Pratinjau besar sampul ${option.label}`"
              @click="openPreview(option.style)"
            ><AppIcon name="eye" :size="18" /></button>
          </div>
        </div>
      </article>
    </div>

    <dialog
      ref="previewDialog"
      class="entrance-preview-dialog"
      aria-labelledby="entrance-preview-title"
      @click.self="closePreview"
      @cancel.prevent="closePreview"
      @close="onDialogClose"
    >
      <div class="entrance-preview-dialog-heading">
        <div>
          <p class="entrance-picker-kicker">Pratinjau layar pembuka</p>
          <h3 id="entrance-preview-title">{{ largePreviewStyle ? templateEntranceStyles.find(item => item.style === largePreviewStyle)?.label : '' }}</h3>
        </div>
        <button
          type="button"
          class="entrance-preview-button"
          autofocus
          aria-label="Tutup pratinjau layar pembuka"
          @click="closePreview"
        ><AppIcon name="close" :size="20" /></button>
      </div>
      <EntranceCover
        v-if="largePreviewStyle"
        :story="largePreviewStory"
        :preview="true"
        preview-size="large"
      />
    </dialog>
  </section>
</template>

<style scoped>
.entrance-picker {
  display: grid;
  gap: 1.25rem;
}

.entrance-picker-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 0.75rem;
}

.entrance-picker-kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.entrance-picker-heading h3,
.entrance-preview-dialog h3 {
  margin: 0.35rem 0 0;
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  font-weight: 400;
}

.entrance-picker-heading > p {
  max-width: 27rem;
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: 0.78rem;
  line-height: 1.55;
}

.entrance-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 0.85rem;
}

.entrance-option {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  background: var(--color-surface);
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.entrance-option-active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary);
}

.entrance-option-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
}

.entrance-option-details h4 {
  margin: 0;
  font-family: 'Instrument Serif', serif;
  font-size: 1.15rem;
  font-weight: 400;
}

.entrance-option-details p {
  margin: 0.15rem 0 0;
  color: var(--color-muted-foreground);
  font-size: 0.66rem;
  line-height: 1.4;
}

.entrance-option-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.35rem;
}

.entrance-select-button,
.entrance-preview-button {
  display: inline-grid;
  min-width: 2.75rem;
  min-height: 2.75rem;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding-inline: 0.75rem;
  color: var(--color-foreground);
  background: var(--color-surface);
  cursor: pointer;
}

.entrance-option-active .entrance-select-button {
  border-color: var(--color-primary);
  color: white;
  background: var(--color-primary);
}

.entrance-select-button:focus-visible,
.entrance-preview-button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.entrance-preview-dialog {
  width: min(94vw, 68rem);
  max-width: 68rem;
  max-height: 92dvh;
  overflow: auto;
  border: 0;
  border-radius: var(--radius-extra-large);
  padding: clamp(1rem, 3vw, 1.5rem);
  color: var(--color-foreground);
  background: var(--color-surface);
}

.entrance-preview-dialog::backdrop {
  background: rgb(23 19 17 / 78%);
  backdrop-filter: blur(0.35rem);
}

.entrance-preview-dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  .entrance-option {
    transition: none;
  }
}
</style>
