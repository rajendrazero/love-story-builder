<template>
  <div class="block">
    <label :for="urlInputId" class="editor-label">{{ label }}</label>
    <div class="flex items-center gap-3">
      <input :id="urlInputId" class="editor-input min-w-0 flex-1" :value="modelValue" type="url" required placeholder="https://... atau unggah foto" :aria-invalid="Boolean(error)" :aria-describedby="error ? errorId : undefined" @input="updateUrl">
      <label :for="fileInputId" class="shrink-0 cursor-pointer rounded-xl border border-[#ded5cb] px-4 py-3 text-xs transition hover:border-[#9c6257]">
        {{ uploading ? 'Mengunggah…' : 'Pilih foto' }}
      </label>
      <input :id="fileInputId" class="sr-only" type="file" accept="image/*" :disabled="uploading" @change="upload">
    </div>
    <div class="mt-2">
      <button
        type="button"
        class="text-xs font-semibold text-[#9c6257] underline underline-offset-4"
        :aria-expanded="libraryOpen"
        :aria-controls="libraryId"
        :disabled="uploading"
        @click="toggleLibrary"
      >
        {{ libraryOpen ? 'Tutup koleksi foto' : 'Pilih dari foto yang sudah diunggah' }}
      </button>
      <div v-if="libraryOpen" :id="libraryId" class="mt-3 rounded-xl border border-[#ded5cb] bg-white p-3">
        <p v-if="libraryLoading" class="text-xs text-[#756a62]" role="status">Memuat koleksi foto…</p>
        <p v-else-if="libraryError" class="text-xs text-red-700" role="alert">{{ libraryError }}</p>
        <p v-else-if="!photos.length" class="text-xs text-[#756a62]">Belum ada foto tersimpan. Foto yang pernah dipakai di draft atau cerita akan muncul di sini.</p>
        <div v-else class="grid max-h-64 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          <button
            v-for="photo in photos"
            :key="photo.url"
            type="button"
            class="overflow-hidden rounded-lg border border-[#ded5cb] text-left transition hover:border-[#9c6257] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9c6257]"
            :aria-label="`Gunakan foto yang sudah diunggah`"
            @click="selectPhoto(photo.url)"
          >
            <img :src="photo.url" alt="" loading="lazy" class="h-24 w-full object-cover">
            <span class="block truncate px-2 py-1 text-[10px] text-[#756a62]">{{ photo.createdAt ? new Date(photo.createdAt).toLocaleDateString('id-ID') : 'Foto tersimpan' }}</span>
          </button>
        </div>
      </div>
    </div>
    <img v-if="modelValue" :src="modelValue" alt="Pratinjau foto" class="mt-3 h-36 w-full rounded-xl object-cover">
    <span v-if="error" :id="errorId" class="mt-2 block text-xs text-red-700" role="alert">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { uploadImageToCloudinary } from '#shared/utils/cloudinary-upload'

const urlInputId = useId()
const fileInputId = `${urlInputId}-file`
const errorId = `${urlInputId}-error`
const libraryId = `${urlInputId}-library`
const props = defineProps<{ modelValue: string, label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const uploading = ref(false)
const error = ref('')
const libraryOpen = ref(false)
const libraryLoading = ref(false)
const libraryError = ref('')
const photos = ref<Array<{ url: string, createdAt: string }>>([])
let libraryLoaded = false

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
    libraryError.value = caught instanceof Error ? caught.message : 'Koleksi foto belum dapat dimuat.'
  } finally {
    libraryLoading.value = false
  }
}

function selectPhoto(url: string) {
  emit('update:modelValue', url)
  libraryOpen.value = false
  error.value = ''
}

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  error.value = ''
  if (!file.type.startsWith('image/')) {
    error.value = 'Pilih file gambar.'
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Ukuran foto maksimal 10 MB.'
    input.value = ''
    return
  }

  uploading.value = true
  try {
    const secureUrl = await uploadImageToCloudinary(
      file,
      () => $fetch('/api/uploads/signature', { method: 'POST' }),
    )
    emit('update:modelValue', secureUrl)
    try {
      await $fetch('/api/uploads/library', { method: 'POST', body: { url: secureUrl } })
      if (libraryLoaded && !photos.value.some(photo => photo.url === secureUrl)) {
        photos.value = [{ url: secureUrl, createdAt: new Date().toISOString() }, ...photos.value]
      }
    } catch (caught) {
      error.value = `Foto berhasil diunggah, tetapi belum tersimpan ke koleksi agar bisa dipakai ulang. ${caught instanceof Error ? caught.message : ''}`.trim()
    }
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Foto belum berhasil diunggah.'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>
