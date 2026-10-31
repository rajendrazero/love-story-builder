<template>
  <main class="grid min-h-screen place-items-center bg-[#f7f4ed] px-5 py-10">
    <section class="w-full max-w-md rounded-[2rem] border border-[#e7ddd4] bg-[#fffdfa] p-7 shadow-xl md:p-10">
      <NuxtLink to="/" class="font-display text-2xl">selamanya<span class="text-[#9c6257]">.</span></NuxtLink>
      <p class="mt-8 text-xs uppercase tracking-[0.25em] text-[#9c6257]">Keamanan akun</p>
      <h1 class="mt-2 font-display text-5xl">Sandi baru.</h1>
      <form class="mt-7 space-y-4" @submit.prevent="resetPassword">
        <label>
          <span class="editor-label">Sandi baru</span>
          <input v-model="password" class="editor-input" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>
          <span class="mt-2 block text-xs text-[#756a62]">Minimal 12 karakter.</span>
        </label>
        <TurnstileWidget ref="turnstile" v-model="captchaToken" />
        <p v-if="message" class="rounded-xl bg-[#f2eee6] p-3 text-sm text-[#756a62]" role="status">{{ message }}</p>
        <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error }}</p>
        <button class="w-full rounded-full bg-[#201d28] px-6 py-4 text-sm text-white disabled:opacity-50" :disabled="busy || !token || !captchaToken">
          {{ busy ? 'Menyimpan…' : 'Simpan sandi baru ↗' }}
        </button>
      </form>
      <NuxtLink to="/login" class="mt-6 inline-block text-sm text-[#9c6257] underline underline-offset-4">Kembali ke masuk</NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
import { createAuthClient } from 'better-auth/vue'

const authClient = createAuthClient()
const route = useRoute()
const token = computed(() => typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const captchaToken = ref('')
const turnstile = ref<{ reset: () => void } | null>(null)
const busy = ref(false)
const message = ref('')
const error = ref('')

useSeoMeta({ title: 'Atur ulang sandi — Selamanya', robots: 'noindex, nofollow' })

async function resetPassword() {
  if (!captchaToken.value) {
    error.value = 'Selesaikan pemeriksaan manusia sebelum mengubah sandi.'
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const result = await authClient.resetPassword({
      newPassword: password.value,
      token: token.value,
      fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } },
    })
    if (result.error) throw new Error(result.error.message || 'Tautan reset tidak valid atau kedaluwarsa.')
    message.value = 'Sandi berhasil diubah. Silakan masuk dengan sandi baru.'
    password.value = ''
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Sandi belum berhasil diubah.'
  } finally {
    turnstile.value?.reset()
    busy.value = false
  }
}
</script>
