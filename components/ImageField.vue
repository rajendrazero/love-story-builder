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
    <img v-if="modelValue" :src="modelValue" alt="Pratinjau foto" class="mt-3 h-36 w-full rounded-xl object-cover">
    <span v-if="error" :id="errorId" class="mt-2 block text-xs text-red-700" role="alert">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
const urlInputId = useId()
const fileInputId = `${urlInputId}-file`
const errorId = `${urlInputId}-error`
const props = defineProps<{ modelValue: string, label: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const uploading = ref(false)
const error = ref('')

function updateUrl(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
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
    const signature = await $fetch<{
      cloudName: string
      apiKey: string
      folder: string
      timestamp: number
      signature: string
    }>('/api/uploads/signature', { method: 'POST' })
    const body = new FormData()
    body.append('file', file)
    body.append('api_key', signature.apiKey)
    body.append('folder', signature.folder)
    body.append('timestamp', String(signature.timestamp))
    body.append('signature', signature.signature)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
      method: 'POST',
      body,
    })
    const result = await response.json() as { secure_url?: string, error?: { message?: string } }
    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || 'Cloudinary gagal mengunggah foto.')
    }
    emit('update:modelValue', result.secure_url)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Foto belum berhasil diunggah.'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>
