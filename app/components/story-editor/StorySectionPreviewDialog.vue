<template>
  <dialog
    ref="previewDialog"
    class="section-preview-dialog"
    :aria-labelledby="titleId"
    @click.self="closePreview"
    @cancel.prevent="closePreview"
    @close="onDialogClose"
  >
    <header class="section-preview-dialog-heading">
      <div>
        <p class="section-preview-kicker">Pratinjau section</p>
        <h2 :id="titleId">{{ sectionLabel }}</h2>
      </div>
      <button
        type="button"
        class="section-preview-close"
        autofocus
        aria-label="Tutup pratinjau section"
        @click="closePreview"
      ><AppIcon name="close" :size="20" /></button>
    </header>
    <p class="section-preview-note">
      Konten contoh melengkapi bagian yang masih kosong. Draft tidak diubah.
    </p>
    <StoryExperience
      v-if="section && open"
      :story="previewStory"
      class="section-preview-stage"
      closable
    />
  </dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, useId, useTemplateRef, watch } from 'vue'
import type { StoryContent } from '#shared/schema/story'
import type { StorySectionConfig } from '#shared/story-sections'
import { createStorySectionPreviewStory } from '#shared/story-section-preview'

const props = defineProps<{
  story: StoryContent
  section: StorySectionConfig | null
  sectionLabel: string
}>()
const open = defineModel<boolean>('open', { required: true })
const previewDialog = useTemplateRef<HTMLDialogElement>('previewDialog')
const titleId = `section-preview-title-${useId()}`
const previewStory = computed(() => {
  const story = createStorySectionPreviewStory(props.story)
  return {
    ...story,
    sectionLayout: props.section ? [{ ...props.section, enabled: true, order: 0 }] : [],
  }
})

watch(open, async (isOpen) => {
  await nextTick()
  const dialog = previewDialog.value
  if (!dialog) return

  if (isOpen && !dialog.open) dialog.showModal()
  else if (!isOpen && dialog.open) dialog.close()
})

function closePreview(): void {
  open.value = false
}

function onDialogClose(): void {
  if (open.value) open.value = false
}
</script>

<style scoped>
.section-preview-dialog {
  width: min(94vw, 72rem);
  max-width: 72rem;
  max-height: 92dvh;
  overflow: auto;
  border: 0;
  border-radius: var(--radius-extra-large);
  padding: clamp(1rem, 3vw, 1.5rem);
  color: var(--color-foreground);
  background: var(--color-surface);
}

.section-preview-dialog::backdrop {
  background: rgb(23 19 17 / 78%);
  backdrop-filter: blur(0.35rem);
}

.section-preview-dialog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-preview-dialog-heading h2 {
  margin: 0.3rem 0 0;
  font-family: 'Instrument Serif', serif;
  font-size: 1.8rem;
  font-weight: 400;
}

.section-preview-kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.section-preview-note {
  margin: 0.75rem 0 1rem;
  color: var(--color-muted-foreground);
  font-size: 0.8rem;
  line-height: 1.5;
}

.section-preview-close {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  color: var(--color-foreground);
  background: var(--color-surface);
  cursor: pointer;
}

.section-preview-close:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.section-preview-stage {
  min-height: 65svh;
  overflow: hidden;
  border-radius: var(--radius-large);
}
</style>
