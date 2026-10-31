<template>
  <div>
    <div v-if="siteKey" ref="container" class="min-h-[65px]" />
    <p v-else class="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900" role="alert">
      Pemeriksaan manusia belum dikonfigurasi. Admin perlu mengatur Turnstile sebelum akun dapat dipakai.
    </p>
    <p v-if="loadError" class="mt-2 text-xs text-red-700" role="alert">{{ loadError }}</p>
  </div>
</template>

<script setup lang="ts">
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
const siteKey = String(config.public.turnstileSiteKey || '')
let widgetId = ''

function reset() {
  emit('update:modelValue', '')
  if (widgetId) window.turnstile?.reset(widgetId)
}

defineExpose({ reset })

onMounted(async () => {
  if (!siteKey || !container.value) return
  try {
    await loadTurnstile()
    if (!window.turnstile || !container.value) {
      throw new Error('Widget pemeriksaan manusia belum siap.')
    }
    widgetId = window.turnstile.render(container.value, {
      sitekey: siteKey,
      theme: 'light',
      callback: token => emit('update:modelValue', token),
      'expired-callback': () => emit('update:modelValue', ''),
      'error-callback': () => {
        emit('update:modelValue', '')
        loadError.value = 'Pemeriksaan manusia gagal. Muat ulang halaman dan coba lagi.'
      },
    })
  } catch (caught) {
    loadError.value = caught instanceof Error ? caught.message : 'Widget pemeriksaan manusia tidak dapat dimuat.'
  }
})

onBeforeUnmount(() => {
  if (widgetId) window.turnstile?.remove(widgetId)
})
</script>
