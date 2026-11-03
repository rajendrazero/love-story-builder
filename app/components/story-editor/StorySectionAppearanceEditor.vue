<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { StoryAppearance } from '#shared/story-appearance'
import type { StorySectionDesign, StorySectionType } from '#shared/story-sections'
import type { StoryTemplateId } from '#shared/story-templates'
import { uploadVideoToCloudinary } from '#shared/utils/cloudinary-video-upload'
import { getUserFacingError } from '#shared/utils/user-facing-error'
import DecorativeLayer from '~/components/story-experience/DecorativeLayer.vue'
import ImageField from '~/components/ImageField.vue'

const props = defineProps<{
  modelValue: StorySectionDesign
  sectionType: StorySectionType
  sectionLabel: string
  templateId: StoryTemplateId
  appearance: StoryAppearance
}>()
const emit = defineEmits<{
  'update:modelValue': [design: StorySectionDesign]
}>()

const stage = useTemplateRef<HTMLDivElement>('stage')
const rightsConfirmed = ref(false)
const uploadingVideo = ref(false)
const uploadError = ref('')
const uploadErrorTitle = ref('Video belum berhasil diunggah')
const isDragging = ref(false)
const backgroundMode = computed(() => props.modelValue.background.type)
const backgroundUrl = computed(() => {
  const background = props.modelValue.background
  return background.type === 'image' || background.type === 'video' ? background.url : ''
})
const imageUrlModel = computed(() => props.modelValue.background.type === 'image'
  ? props.modelValue.background.url
  : '')
const scene = computed(() => {
  if (props.sectionType === 'hero') return 'hero'
  if (props.sectionType === 'gallery') return 'gallery'
  if (props.sectionType === 'book') return 'book'
  if (props.sectionType === 'greeting') return 'greeting'
  if (props.sectionType === 'finale') return 'finale'
  return 'detail'
})
const previewBackgroundStyle = computed(() => ({
  backgroundColor: props.modelValue.background.type === 'color'
    ? props.modelValue.background.color
    : props.appearance.backgroundColor,
}))
const ornamentStyle = computed(() => ({
  left: `${props.modelValue.ornament.x}%`,
  top: `${props.modelValue.ornament.y}%`,
  right: 'auto',
  bottom: 'auto',
  transform: `translate(-50%, -50%) scale(${props.modelValue.ornament.scale / 100})`,
}))
const handleStyle = computed(() => ({
  left: `${props.modelValue.ornament.x}%`,
  top: `${props.modelValue.ornament.y}%`,
}))

function updateBackground(background: StorySectionDesign['background']): void {
  emit('update:modelValue', { ...props.modelValue, background })
}

function selectBackgroundMode(event: Event): void {
  if (!(event.currentTarget instanceof HTMLSelectElement)) return
  const type = event.currentTarget.value
  const previous = props.modelValue.background
  if (type === 'theme') updateBackground({ type })
  else if (type === 'color') {
    updateBackground({
      type,
      color: previous.type === 'color' ? previous.color : props.appearance.backgroundColor,
    })
  } else if (type === 'image' || type === 'video') {
    updateBackground({
      type,
      url: previous.type === type ? previous.url : '',
    })
  }
}

function updateImageUrl(value: string): void {
  updateBackground({ type: 'image', url: value })
}

function updateVideoUrl(event: Event): void {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  updateBackground({ type: 'video', url: event.currentTarget.value })
}

function updateColor(event: Event): void {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  updateBackground({ type: 'color', color: event.currentTarget.value })
}

function updateOrnament(
  patch: Partial<StorySectionDesign['ornament']>,
): void {
  emit('update:modelValue', {
    ...props.modelValue,
    ornament: { ...props.modelValue.ornament, ...patch },
  })
}

function updateOrnamentEnabled(event: Event): void {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  updateOrnament({ enabled: event.currentTarget.checked })
}

function updateOrnamentScale(event: Event): void {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  const scale = Number(event.currentTarget.value)
  if (!Number.isFinite(scale)) return
  updateOrnament({ scale: Math.max(50, Math.min(150, scale)) })
}

function moveOrnament(event: PointerEvent): void {
  if (!isDragging.value) return
  const bounds = stage.value?.getBoundingClientRect()
  if (!bounds || !bounds.width || !bounds.height) return
  updateOrnament({
    x: Math.round(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))),
    y: Math.round(Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100))),
  })
}

function startDragging(event: PointerEvent): void {
  if (event.button !== 0) return
  isDragging.value = true
  stage.value?.setPointerCapture(event.pointerId)
  moveOrnament(event)
}

function stopDragging(): void {
  isDragging.value = false
}

function moveWithKeyboard(event: KeyboardEvent): void {
  const delta = event.shiftKey ? 10 : 2
  const patch: Partial<StorySectionDesign['ornament']> = {}
  if (event.key === 'ArrowLeft') patch.x = Math.max(0, props.modelValue.ornament.x - delta)
  else if (event.key === 'ArrowRight') patch.x = Math.min(100, props.modelValue.ornament.x + delta)
  else if (event.key === 'ArrowUp') patch.y = Math.max(0, props.modelValue.ornament.y - delta)
  else if (event.key === 'ArrowDown') patch.y = Math.min(100, props.modelValue.ornament.y + delta)
  else return
  event.preventDefault()
  updateOrnament(patch)
}

async function uploadVideo(event: Event): Promise<void> {
  if (!(event.currentTarget instanceof HTMLInputElement)) return
  const input = event.currentTarget
  const file = input.files?.[0]
  if (!file) return

  uploadError.value = ''
  uploadingVideo.value = true
  try {
    const url = await uploadVideoToCloudinary(file, rightsConfirmed.value)
    updateBackground({ type: 'video', url })
  } catch (caught) {
    const details = getUserFacingError(caught, {
      title: 'Video belum berhasil diunggah',
      fallback: 'Periksa format video, hak penggunaannya, dan koneksi internet, lalu coba lagi.',
      location: `${props.sectionLabel} · Latar video`,
    })
    uploadError.value = details.message
    uploadErrorTitle.value = details.title
  } finally {
    uploadingVideo.value = false
    input.value = ''
  }
}
</script>

<template>
  <section class="section-appearance-editor" :aria-labelledby="`section-appearance-${sectionType}`">
    <header class="section-appearance-heading">
      <div>
        <p class="section-appearance-kicker">Tampilan section</p>
        <h3 :id="`section-appearance-${sectionType}`">Atur latar & ornamen · {{ sectionLabel }}</h3>
        <p>Secara otomatis mengikuti tema. Kamu bisa mengganti latar dan menggeser ornamen untuk section ini.</p>
      </div>
    </header>

    <div class="section-appearance-controls">
      <label class="design-field">
        <span>Jenis latar</span>
        <select :value="backgroundMode" @change="selectBackgroundMode">
          <option value="theme">Ikuti tema</option>
          <option value="color">Warna khusus</option>
          <option value="image">Foto</option>
          <option value="video">Video</option>
        </select>
      </label>

      <label v-if="backgroundMode === 'color'" class="design-field">
        <span>Warna latar section</span>
        <span class="design-color-input">
          <input
            :value="modelValue.background.type === 'color' ? modelValue.background.color : appearance.backgroundColor"
            type="color"
            aria-label="Warna latar section"
            @input="updateColor"
          >
          <code>{{ modelValue.background.type === 'color' ? modelValue.background.color : appearance.backgroundColor }}</code>
        </span>
      </label>

      <ImageField
        v-if="backgroundMode === 'image'"
        :model-value="imageUrlModel"
        :label="`Foto latar ${sectionLabel}`"
        @update:model-value="updateImageUrl"
      />

      <div v-if="backgroundMode === 'video'" class="design-video-fields">
        <label class="design-field">
          <span>URL video HTTPS</span>
          <input
            :value="backgroundUrl"
            class="editor-input"
            type="url"
            inputmode="url"
            autocomplete="url"
            placeholder="https://... tautan langsung MP4 atau WebM"
            @input="updateVideoUrl"
          >
        </label>
        <label class="video-upload-label">
          <span class="video-upload-button">
            <AppIcon name="upload" :size="17" />
            {{ uploadingVideo ? 'Mengunggah video…' : 'Unggah video MP4/WebM' }}
          </span>
          <input
            class="sr-only"
            type="file"
            accept="video/mp4,video/webm"
            :disabled="uploadingVideo"
            @change="uploadVideo"
          >
        </label>
        <label class="rights-confirmation">
          <input v-model="rightsConfirmed" type="checkbox">
          <span>Saya memiliki hak untuk menggunakan video ini.</span>
        </label>
        <p class="design-upload-hint">Ukuran maksimal 50 MB. File diperiksa berdasarkan format dan isi sebelum disimpan ke akunmu.</p>
        <AppErrorAlert
          v-if="uploadError"
          :title="uploadErrorTitle"
          :message="uploadError"
          :location="`${sectionLabel} · Latar video`"
        />
      </div>
    </div>

    <div class="section-ornament-controls">
      <label class="ornament-toggle">
        <input
          :checked="modelValue.ornament.enabled"
          type="checkbox"
          @change="updateOrnamentEnabled"
        >
        <span>Tampilkan ornamen pada section ini</span>
      </label>
      <label v-if="modelValue.ornament.enabled" class="design-field ornament-scale">
        <span>Ukuran ornamen · {{ modelValue.ornament.scale }}%</span>
        <input
          :value="modelValue.ornament.scale"
          type="range"
          min="50"
          max="150"
          step="5"
          aria-label="Ukuran ornamen"
          @input="updateOrnamentScale"
        >
      </label>
    </div>

    <div
      ref="stage"
      class="section-design-preview"
      :class="{ 'section-design-preview-dragging': isDragging }"
      :style="previewBackgroundStyle"
      role="group"
      :aria-label="`Pratinjau latar ${sectionLabel}; posisi ornamen ${modelValue.ornament.x}% dari kiri dan ${modelValue.ornament.y}% dari atas`"
      @pointermove="moveOrnament"
      @pointerup="stopDragging"
      @pointercancel="stopDragging"
    >
      <img
        v-if="backgroundMode === 'image' && backgroundUrl"
        class="section-design-preview-media"
        :src="backgroundUrl"
        alt=""
      >
      <video
        v-if="backgroundMode === 'video' && backgroundUrl"
        class="section-design-preview-media"
        :src="backgroundUrl"
        controls
        muted
        playsinline
      />
      <DecorativeLayer
        v-if="modelValue.ornament.enabled"
        class="section-design-preview-ornament"
        :template-id="templateId"
        :scene="scene"
        :style="ornamentStyle"
      />
      <button
        v-if="modelValue.ornament.enabled"
        type="button"
        class="section-ornament-handle"
        :style="handleStyle"
        :aria-label="`Posisi ornamen ${sectionLabel}: ${modelValue.ornament.x}% dari kiri, ${modelValue.ornament.y}% dari atas. Gunakan tombol panah untuk mengatur posisinya`"
        @pointerdown="startDragging"
        @keydown="moveWithKeyboard"
      ><AppIcon name="move" :size="18" /></button>
      <p v-if="modelValue.ornament.enabled" class="section-design-preview-hint">Seret ornamen atau fokuskan lalu gunakan tombol panah.</p>
      <p v-else class="section-design-preview-hint">Ornamen nonaktif</p>
    </div>
  </section>
</template>

<style scoped>
.section-appearance-editor {
  display: grid;
  gap: 1rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.25rem;
}

.section-appearance-heading h3 {
  margin: 0.25rem 0;
  font-family: var(--font-family-display);
  font-size: 1.4rem;
}

.section-appearance-heading p:last-child {
  margin: 0;
  color: var(--color-muted-foreground);
  font-size: 0.8rem;
  line-height: 1.5;
}

.section-appearance-kicker {
  margin: 0;
  color: var(--color-primary);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.section-appearance-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  align-items: start;
  gap: 1rem;
}

.design-field {
  display: grid;
  min-width: 0;
  gap: 0.45rem;
  color: var(--color-foreground);
  font-size: 0.8rem;
  font-weight: 600;
}

.design-field select,
.design-field > input[type='url'],
.design-field > input[type='text'] {
  min-height: 2.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding-inline: 0.75rem;
  color: var(--color-foreground);
  background: var(--color-surface);
}

.design-color-input {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding: 0.35rem 0.6rem;
  background: var(--color-surface);
}

.design-color-input input {
  width: 2.2rem;
  height: 2rem;
  border: 0;
  padding: 0;
  background: transparent;
}

.design-color-input code,
.design-upload-hint {
  color: var(--color-muted-foreground);
  font-size: 0.75rem;
}

.design-video-fields {
  display: grid;
  gap: 0.65rem;
}

.video-upload-label {
  width: fit-content;
  cursor: pointer;
}

.video-upload-button {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding: 0.5rem 0.8rem;
  color: var(--color-foreground);
  background: var(--color-surface);
  font-size: 0.8rem;
  font-weight: 600;
}

.video-upload-label:focus-within .video-upload-button {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

.rights-confirmation,
.ornament-toggle {
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.55rem;
  color: var(--color-foreground);
  font-size: 0.8rem;
}

.rights-confirmation input,
.ornament-toggle input {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
}

.design-upload-hint {
  margin: 0;
  line-height: 1.5;
}

.section-ornament-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.ornament-scale {
  width: min(100%, 18rem);
}

.ornament-scale input {
  width: 100%;
  accent-color: var(--color-primary);
}

.section-design-preview {
  position: relative;
  isolation: isolate;
  aspect-ratio: 16 / 9;
  min-height: 11rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--color-border), transparent 20%);
  border-radius: var(--radius-large);
  background-size: cover;
  background-position: center;
  touch-action: pan-y;
}

.section-design-preview-media {
  position: absolute;
  z-index: -1;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-design-preview-ornament {
  z-index: 0;
  opacity: 0.6;
}

.section-ornament-handle {
  position: absolute;
  z-index: 2;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 2px solid white;
  border-radius: 50%;
  color: white;
  background: var(--color-primary);
  box-shadow: 0 2px 12px rgb(0 0 0 / 35%);
  cursor: grab;
  touch-action: none;
  transform: translate(-50%, -50%);
}

.section-design-preview-dragging .section-ornament-handle {
  cursor: grabbing;
}

.section-ornament-handle:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}

.section-design-preview-hint {
  position: absolute;
  z-index: 2;
  right: 0.65rem;
  bottom: 0.65rem;
  margin: 0;
  border-radius: 999px;
  padding: 0.3rem 0.55rem;
  color: white;
  background: rgb(32 29 40 / 78%);
  font-size: 0.68rem;
  pointer-events: none;
}
</style>
