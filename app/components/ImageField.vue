<template>
  <div class="block">
    <div class="flex items-center gap-3">
      <div class="floating-field min-w-0 flex-1">
        <label :for="urlInputId" class="editor-label">{{ label }}</label>
        <input :id="urlInputId" class="editor-input min-w-0" :value="modelValue" type="url" required placeholder="https://... atau unggah foto" :aria-invalid="Boolean(error)" :aria-describedby="error ? errorId : undefined" @input="updateUrl">
      </div>
      <label :for="fileInputId" class="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#ded5cb] px-4 py-3 text-xs transition hover:border-[#9c6257]">
        <AppIcon name="image-plus" :size="16" />
        {{ uploading ? 'Mengunggah…' : 'Pilih foto' }}
      </label>
      <input :id="fileInputId" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp" :disabled="uploading" @change="upload">
    </div>
    <div class="mt-2">
      <button
        type="button"
        class="inline-flex min-h-11 items-center text-xs font-semibold text-[#9c6257] underline underline-offset-4"
        :aria-expanded="libraryOpen"
        :aria-controls="libraryId"
        :disabled="uploading"
        @click="toggleLibrary"
      >
        {{ libraryOpen ? 'Tutup koleksi foto' : 'Pilih dari foto yang sudah diunggah' }}
      </button>
      <div v-if="libraryOpen" :id="libraryId" class="mt-3 rounded-xl border border-[#ded5cb] bg-white p-3">
        <p v-if="libraryLoading" class="text-xs text-[#756a62]" role="status">Memuat koleksi foto…</p>
        <AppErrorAlert
          v-else-if="libraryError"
          :title="libraryErrorTitle"
          :message="libraryError"
          :location="`${label} · Koleksi foto`"
        />
        <p v-else-if="!photos.length" class="text-xs text-[#756a62]">Belum ada foto tersimpan. Foto yang pernah dipakai di draft atau cerita akan muncul di sini.</p>
        <div v-else class="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          <div
            v-for="(photo, index) in photos"
            :key="photo.url"
            class="overflow-hidden rounded-lg border border-[#ded5cb]"
          >
            <button
              type="button"
              class="block min-h-11 w-full text-left transition hover:outline hover:outline-2 hover:outline-[#9c6257] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9c6257]"
              :aria-label="`Gunakan foto ${index + 1} dari koleksi foto`"
              @click="selectPhoto(photo.url)"
            >
              <img :src="photo.url" alt="" loading="lazy" class="h-24 w-full object-cover">
              <span class="block truncate px-2 py-2 text-[10px] text-[#756a62]">{{ photo.createdAt ? new Date(photo.createdAt).toLocaleDateString('id-ID') : 'Foto tersimpan' }}</span>
            </button>
            <button
              type="button"
              class="min-h-11 w-full border-t border-[#ded5cb] px-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-red-700 disabled:cursor-wait disabled:opacity-60"
              :aria-label="`Hapus permanen foto ${index + 1} dari koleksi`"
              :disabled="uploading || deletingPhotoUrl !== null"
              @click="deletePhoto(photo.url)"
            >
              <span class="inline-flex items-center justify-center gap-2">
                <AppIcon name="trash" :size="15" />
                {{ deletingPhotoUrl === photo.url ? 'Menghapus…' : 'Hapus foto permanen' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <img v-if="modelValue" :src="modelValue" alt="Pratinjau foto" class="mt-3 h-36 w-full rounded-xl object-cover">
    <AppErrorAlert
      v-if="error"
      :id="errorId"
      class="mt-2"
      :title="errorTitle"
      :message="error"
      :location="label"
    />
  </div>
</template>

<script setup lang="ts">
import { uploadImageToCloudinary } from '#shared/utils/cloudinary-upload'
import { isAllowedCloudinaryImageMimeType, MAX_CLOUDINARY_IMAGE_SIZE } from '#shared/utils/cloudinary-upload-policy'
import { getUserFacingError } from '#shared/utils/user-facing-error'

const urlInputId = useId()
const fileInputId = `${urlInputId}-file`
const errorId = `${urlInputId}-error`
const libraryId = `${urlInputId}-library`
const props = defineProps<{ modelValue: string, label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const uploading = ref(false)
const error = ref('')
const errorTitle = ref('Foto belum berhasil diproses')
const libraryOpen = ref(false)
const libraryLoading = ref(false)
const libraryError = ref('')
const libraryErrorTitle = ref('Koleksi foto belum dapat dimuat')
const deletingPhotoUrl = ref<string | null>(null)
const photos = ref<Array<{ url: string, createdAt: string }>>([])
let libraryLoaded = false
const confirm = useAppConfirmation()

function updateUrl(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

async function toggleLibrary() {
  libraryOpen.value = !libraryOpen.value
  if (!libraryOpen.value || libraryLoaded || libraryLoading.value) return

  libraryLoading.value = true
  libraryError.value = ''
  try {
    const result = await $fetch<{ photos: Array<{ url: string, createdAt: string }> }>('/api/uploads/library')
    photos.value = result.photos
    libraryLoaded = true
  } catch (caught) {
    const details = getUserFacingError(caught, {
      title: 'Koleksi foto belum dapat dimuat',
      fallback: 'Periksa koneksi dan coba buka koleksi foto lagi.',
      location: `${props.label} · Koleksi foto`,
    })
    libraryError.value = details.message
    libraryErrorTitle.value = details.title
  } finally {
    libraryLoading.value = false
  }
}

function selectPhoto(url: string) {
  emit('update:modelValue', url)
  libraryOpen.value = false
  error.value = ''
}

async function deletePhoto(url: string) {
  const confirmed = await confirm({
    title: 'Hapus foto permanen?',
    message: 'Foto akan dihapus dari Cloudinary dan tidak bisa dipulihkan. Foto yang masih digunakan di draft atau cerita akan ditolak.',
    confirmLabel: 'Hapus permanen',
    tone: 'danger',
  })
  if (!confirmed) return

  deletingPhotoUrl.value = url
  libraryError.value = ''
  try {
    await $fetch('/api/uploads/library', { method: 'DELETE', query: { url } })
    photos.value = photos.value.filter(photo => photo.url !== url)
    if (props.modelValue === url) emit('update:modelValue', '')
  } catch (caught) {
    const details = getUserFacingError(caught, {
      title: 'Foto belum dapat dihapus',
      fallback: 'Coba lagi. Foto tetap ada di koleksi.',
      location: `${props.label} · Koleksi foto`,
    })
    libraryError.value = details.message
    libraryErrorTitle.value = details.title
  } finally {
    deletingPhotoUrl.value = null
  }
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  error.value = ''
  if (!isAllowedCloudinaryImageMimeType(file.type)) {
    error.value = 'Pilih foto berformat JPEG, PNG, atau WebP.'
    input.value = ''
    return
  }
  if (file.size > MAX_CLOUDINARY_IMAGE_SIZE) {
    error.value = 'Ukuran foto maksimal 10 MB.'
    input.value = ''
    return
  }

  uploading.value = true
  try {
    const secureUrl = await uploadImageToCloudinary(file)
    emit('update:modelValue', secureUrl)
    try {
      await $fetch('/api/uploads/library', { method: 'POST', body: { url: secureUrl } })
      if (libraryLoaded && !photos.value.some(photo => photo.url === secureUrl)) {
        photos.value = [{ url: secureUrl, createdAt: new Date().toISOString() }, ...photos.value]
      }
    } catch (caught) {
      const details = getUserFacingError(caught, {
        title: 'Foto berhasil diunggah, tetapi belum masuk koleksi',
        fallback: 'Foto ini bisa dipakai sekarang, tetapi belum tersimpan untuk digunakan ulang.',
        location: `${props.label} · Koleksi foto`,
      })
      error.value = `Foto sudah dapat dipakai. ${details.message}`
      errorTitle.value = details.title
    }
  } catch (caught) {
    const details = getUserFacingError(caught, {
      title: 'Foto belum berhasil diunggah',
      fallback: 'Periksa format dan ukuran foto, lalu coba lagi.',
      location: props.label,
    })
    error.value = details.message
    errorTitle.value = details.title
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>
