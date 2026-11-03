<template>
  <fieldset class="audio-field min-w-0 border-0 p-0" :aria-busy="uploading">
    <legend class="editor-label">Musik cerita</legend>
    <div class="floating-field">
      <label :for="urlInputId" class="editor-label">URL audio langsung (opsional)</label>
      <input
        :id="urlInputId"
        v-model="model"
        class="editor-input"
        name="musicUrl"
        type="url"
        placeholder="https://.../lagu.mp3"
        :disabled="uploading"
        :aria-describedby="helpId"
      >
    </div>
    <p :id="helpId" class="mt-2 text-xs leading-5 text-muted">
      Gunakan URL HTTPS file MP3, M4A, OGG, atau WAV. Spotify, YouTube, dan SoundCloud tidak didukung untuk pemutaran langsung.
    </p>
    <label class="mt-4 flex min-h-11 items-start gap-3 text-xs leading-5 text-muted">
      <input v-model="rightsConfirmed" class="mt-1 size-4 accent-[#9c6257]" type="checkbox" :disabled="uploading">
      Saya memiliki hak atau izin untuk menggunakan file audio yang akan diunggah.
    </label>
    <div class="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="min-h-11 rounded-xl border border-[#ded5cb] px-4 py-2 text-xs font-semibold transition hover:border-[#9c6257] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9c6257] disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="uploading || !rightsConfirmed"
        :aria-describedby="error ? `${uploadHelpId} ${errorId}` : uploadHelpId"
        @click="fileInput?.click()"
      >
        <AppIcon name="upload" :size="16" />
        {{ uploading ? 'Mengunggah audio…' : 'Unggah file audio' }}
      </button>
      <span :id="uploadHelpId" class="text-xs text-muted">MP3, M4A, OGG, WAV · maksimal 20 MB · folder akun Cloudinary</span>
      <input
        ref="fileInput"
        :id="`${urlInputId}-file`"
        class="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:rounded-xl focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        type="file"
        :accept="ALLOWED_CLOUDINARY_AUDIO_MIME_TYPES.join(',')"
        :disabled="uploading || !rightsConfirmed"
        :aria-describedby="error ? `${uploadHelpId} ${errorId}` : uploadHelpId"
        :aria-invalid="Boolean(error)"
        aria-label="Pilih file audio"
        @change="upload"
      >
      <span class="sr-only" role="status">{{ uploading ? 'Mengunggah file audio ke akun.' : '' }}</span>
    </div>
    <AppErrorAlert
      v-if="error"
      :id="errorId"
      role="alert"
      class="mt-2"
      title="Audio belum berhasil diunggah"
      :message="error"
      location="Studio · Langkah 7 · Musik cerita"
    />
    <p v-else class="mt-2 min-h-5" aria-hidden="true" />
  </fieldset>
</template>

<script setup lang="ts">
import { uploadAudioToCloudinary } from '#shared/utils/cloudinary-audio-upload'
import {
  ALLOWED_CLOUDINARY_AUDIO_MIME_TYPES,
  isAllowedCloudinaryAudioMimeType,
  MAX_CLOUDINARY_AUDIO_SIZE,
} from '#shared/utils/cloudinary-upload-policy'
import { getUserFacingError } from '#shared/utils/user-facing-error'

const model = defineModel<string>({ required: true })

const urlInputId = useId()
const helpId = `${urlInputId}-help`
const uploadHelpId = `${urlInputId}-upload-help`
const errorId = `${urlInputId}-error`
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const rightsConfirmed = ref(false)
const uploading = ref(false)
const error = ref('')

async function upload(event: Event): Promise<void> {
  const input = event.currentTarget
  if (!(input instanceof HTMLInputElement)) return
  const file = input.files?.[0]
  if (!file) return

  error.value = ''
  if (!rightsConfirmed.value) {
    error.value = 'Konfirmasi hak penggunaan file sebelum mengunggah.'
    input.value = ''
    return
  }
  if (!isAllowedCloudinaryAudioMimeType(file.type)) {
    error.value = 'Pilih file MP3, M4A, OGG, atau WAV.'
    input.value = ''
    return
  }
  if (file.size > MAX_CLOUDINARY_AUDIO_SIZE) {
    error.value = 'Ukuran audio maksimal 20 MB.'
    input.value = ''
    return
  }

  uploading.value = true
  try {
    const url = await uploadAudioToCloudinary(file, rightsConfirmed.value)
    model.value = url
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Audio belum berhasil diunggah',
      fallback: 'Periksa format dan ukuran file, lalu coba lagi.',
      location: 'Studio · Langkah 7 · Musik cerita',
    }).message
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>
