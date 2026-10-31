<template>
  <main class="grid min-h-screen place-items-center bg-[#f7f4ed] px-5 py-10">
    <section class="w-full max-w-md rounded-[2rem] border border-[#e7ddd4] bg-[#fffdfa] p-7 shadow-xl md:p-10">
      <NuxtLink to="/" class="font-display text-2xl">selamanya<span class="text-[#9c6257]">.</span></NuxtLink>
      <p class="mt-8 text-xs uppercase tracking-[0.25em] text-[#9c6257]">Ruang pribadi kalian</p>
      <h1 class="mt-2 font-display text-5xl">{{ mode === 'signup' ? 'Buat akun.' : 'Selamat datang.' }}</h1>
      <p class="mt-3 text-sm leading-6 text-[#756a62]">
        {{ mode === 'signup' ? 'Daftar untuk menyimpan, mengelola, dan menerbitkan cerita milikmu.' : 'Masuk untuk melanjutkan cerita dan mengelola halamanmu.' }}
      </p>

      <form class="mt-7 space-y-4" @submit.prevent="submit">
        <label v-if="mode === 'signup'">
          <span class="editor-label">Nama</span>
          <input v-model="name" class="editor-input" autocomplete="name" maxlength="80" required>
        </label>
        <label>
          <span class="editor-label">Email</span>
          <input v-model="email" class="editor-input" type="email" autocomplete="email" maxlength="254" required>
        </label>
        <label>
          <span class="editor-label">Sandi</span>
          <input v-model="password" class="editor-input" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" :minlength="mode === 'signup' ? 12 : 1" maxlength="128" required>
          <span v-if="mode === 'signup'" class="mt-2 block text-xs text-[#756a62]">Minimal 12 karakter.</span>
        </label>
        <TurnstileWidget ref="turnstile" v-model="captchaToken" />
        <p v-if="message" class="rounded-xl bg-[#f2eee6] p-3 text-sm text-[#756a62]" role="status">{{ message }}</p>
        <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{{ error }}</p>
        <button class="w-full rounded-full bg-[#201d28] px-6 py-4 text-sm text-white disabled:opacity-50" :disabled="busy || !captchaToken">
          {{ busy ? 'Mohon tunggu…' : mode === 'signup' ? 'Daftar & verifikasi email ↗' : 'Masuk ↗' }}
        </button>
      </form>

      <button v-if="mode === 'signin'" type="button" class="mt-4 text-sm text-[#9c6257] underline underline-offset-4" :disabled="busy" @click="sendResetLink">
        Lupa sandi?
      </button>
      <p class="mt-7 text-sm text-[#756a62]">
        {{ mode === 'signup' ? 'Sudah punya akun?' : 'Belum punya akun?' }}
        <NuxtLink
          :to="{ path: mode === 'signup' ? '/login' : '/register', query: route.query }"
          class="font-semibold text-[#9c6257] underline underline-offset-4"
        >
          {{ mode === 'signup' ? 'Masuk' : 'Daftar' }}
        </NuxtLink>
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import { createAuthClient } from 'better-auth/vue'

definePageMeta({ alias: ['/register'] })
const authClient = createAuthClient()
const route = useRoute()
const router = useRouter()
const mode = ref<'signin' | 'signup'>(route.path === '/register' || route.query.mode === 'signup' ? 'signup' : 'signin')
const name = ref('')
const email = ref('')
const password = ref('')
const captchaToken = ref('')
const turnstile = ref<{ reset: () => void } | null>(null)
const busy = ref(false)
const message = ref('')
const error = ref('')

useSeoMeta({ title: 'Masuk atau daftar — Selamanya', robots: 'noindex, nofollow' })

watch(() => route.path, path => {
  mode.value = path === '/register' ? 'signup' : 'signin'
  message.value = ''
  error.value = ''
})

function destination() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/account'
  return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/account'
}

async function submit() {
  if (!captchaToken.value) {
    error.value = 'Selesaikan pemeriksaan manusia sebelum melanjutkan.'
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    if (mode.value === 'signup') {
      const result = await authClient.signUp.email({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
        callbackURL: destination(),
        fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } },
      })
      if (result.error) throw new Error(result.error.message || 'Pendaftaran belum berhasil.')
      message.value = 'Akun dibuat. Buka email untuk verifikasi sebelum masuk.'
      return
    }

    const result = await authClient.signIn.email({
      email: email.value.trim(),
      password: password.value,
      callbackURL: destination(),
      fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } },
    })
    if (result.error) throw new Error(result.error.message || 'Email atau sandi tidak benar.')
    await router.push(destination())
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Permintaan belum berhasil.'
  } finally {
    turnstile.value?.reset()
    busy.value = false
  }
}

async function sendResetLink() {
  if (!captchaToken.value) {
    error.value = 'Selesaikan pemeriksaan manusia sebelum meminta tautan reset.'
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const result = await authClient.requestPasswordReset({
      email: email.value.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
      fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } },
    })
    if (result.error) throw new Error(result.error.message || 'Email reset belum berhasil dikirim.')
    message.value = 'Jika email terdaftar, tautan reset sandi akan dikirim.'
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Permintaan reset belum berhasil.'
  } finally {
    turnstile.value?.reset()
    busy.value = false
  }
}
</script>
