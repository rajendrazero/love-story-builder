<template>
  <div>
    <div v-if="siteKey" ref="container" class="min-h-[65px]" />
    <p v-else class="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900" role="alert">
      Pemeriksaan manusia belum dikonfigurasi. Admin perlu mengatur Turnstile sebelum akun dapat dipakai.
    </p>
    <AppErrorAlert
      v-if="loadError"
      class="mt-2"
      title="Pemeriksaan keamanan belum siap"
      :message="loadError"
      location="Form akun · Verifikasi Turnstile"
    />
  </div>
</template>

<script setup lang="ts">
import { getUserFacingError } from '#shared/utils/user-facing-error'

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string
      theme: 'light'
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
    },
  ): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let turnstilePromise: Promise<void> | undefined

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (turnstilePromise) return turnstilePromise

  turnstilePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Skrip pemeriksaan manusia tidak dapat dimuat.'))
    document.head.append(script)
  })
  return turnstilePromise
}

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const container = ref<HTMLElement | null>(null)
const loadError = ref('')
const config = useRuntimeConfig()
const siteKey = ref(String(config.public.turnstileSiteKey || ''))
let widgetId = ''

function reset() {
  emit('update:modelValue', '')
  if (widgetId) window.turnstile?.reset(widgetId)
}

defineExpose({ reset })

onMounted(async () => {
  if (!siteKey.value || !container.value) {
    try {
      const runtimeConfig = await $fetch<{ siteKey: string }>('/api/config/turnstile')
      siteKey.value = runtimeConfig.siteKey
    } catch (caught) {
      loadError.value = getUserFacingError(caught, {
        title: 'Konfigurasi pemeriksaan keamanan belum dapat dimuat',
        fallback: 'Periksa koneksi, lalu muat ulang halaman.',
        location: 'Form akun · Verifikasi Turnstile',
      }).message
      return
    }
  }
  if (!siteKey.value || !container.value) return
  try {
    await loadTurnstile()
    if (!window.turnstile || !container.value) {
      throw new Error('Widget pemeriksaan manusia belum siap.')
    }
    widgetId = window.turnstile.render(container.value, {
      sitekey: siteKey.value,
      theme: 'light',
      callback: token => emit('update:modelValue', token),
      'expired-callback': () => emit('update:modelValue', ''),
      'error-callback': () => {
        emit('update:modelValue', '')
        loadError.value = 'Pemeriksaan manusia gagal. Muat ulang halaman dan coba lagi.'
      },
    })
  } catch (caught) {
    loadError.value = getUserFacingError(caught, {
      title: 'Pemeriksaan keamanan belum siap',
      fallback: 'Muat ulang halaman atau coba lagi beberapa saat.',
      location: 'Form akun · Verifikasi Turnstile',
    }).message
  }
})

onBeforeUnmount(() => {
  if (widgetId) window.turnstile?.remove(widgetId)
})
</script>
