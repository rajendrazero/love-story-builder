<template>
  <main class="brand-ui reset-page">
    <section class="reset-card">
      <NuxtLink to="/" class="auth-brand">selamanya<span>.</span></NuxtLink>
      <div class="reset-heading">
        <p class="auth-overline">Keamanan akun</p>
        <h1>Kata sandi baru.</h1>
        <p class="reset-intro">Pilih kata sandi baru untuk mengamankan akun dan cerita kalian.</p>
      </div>
      <p v-if="!token" class="reset-feedback reset-feedback-error" role="alert">Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk.</p>
      <form class="reset-form" @submit.prevent="resetPassword">
        <label>
          <span class="editor-label">Kata sandi baru</span>
          <input v-model="password" class="editor-input" type="password" autocomplete="new-password" minlength="12" maxlength="128" required>
          <span class="reset-hint">Gunakan minimal 12 karakter.</span>
        </label>
        <TurnstileWidget ref="turnstile" v-model="captchaToken" />
        <p v-if="message" class="reset-feedback reset-feedback-success" role="status">{{ message }}</p>
        <p v-if="error" class="reset-feedback reset-feedback-error" role="alert">{{ error }}</p>
        <button class="reset-submit" :disabled="busy || !token || !captchaToken">
          <span>{{ busy ? 'Menyimpan…' : 'Simpan kata sandi baru' }}</span><span aria-hidden="true">↗</span>
        </button>
      </form>
      <NuxtLink to="/login" class="reset-login-link">Kembali ke masuk</NuxtLink>
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

<style scoped>
.reset-page {
  display: grid;
  min-height: 100svh;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(ellipse at 12% 12%, rgb(216 243 106 / 18%), transparent 32rem),
    var(--brand-paper);
}
.reset-card {
  width: min(100%, 30rem);
  border: 1px solid #e5e1d8;
  border-radius: 1.75rem;
  padding: clamp(1.5rem, 6vw, 2.75rem);
  background: #fffdfa;
  box-shadow: 0 1.5rem 5rem rgb(32 29 40 / 10%);
}
.reset-card .auth-brand {
  color: var(--brand-ink);
  font-family: 'Instrument Serif', serif;
  font-size: 1.8rem;
  text-decoration: none;
}
.reset-card .auth-brand span { color: var(--brand-cobalt); }
.reset-heading { margin-top: 2rem; }
.reset-heading .auth-overline {
  margin: 0;
  color: var(--brand-cobalt);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.reset-heading h1 {
  margin: 0.45rem 0 0;
  color: var(--brand-ink);
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2.7rem, 8vw, 3.5rem);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1;
}
.reset-intro {
  margin: 0.7rem 0 0;
  color: var(--brand-muted);
  font-size: 0.85rem;
  line-height: 1.7;
}
.reset-form { display: grid; gap: 1rem; margin-top: 1.5rem; }
.reset-form .editor-input { min-height: 3.1rem; }
.reset-hint {
  display: block;
  margin-top: 0.5rem;
  color: var(--brand-muted);
  font-size: 0.7rem;
}
.reset-submit {
  display: flex;
  min-height: 3.3rem;
  align-items: center;
  justify-content: space-between;
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1.25rem;
  color: white;
  background: var(--brand-cobalt);
  font-size: 0.82rem;
  font-weight: 600;
}
.reset-submit:hover:not(:disabled) { background: #4038cc; }
.reset-submit:disabled { cursor: not-allowed; opacity: 0.5; }
.reset-feedback {
  margin: 1rem 0 0;
  border-radius: 0.9rem;
  padding: 0.8rem 0.9rem;
  font-size: 0.78rem;
  line-height: 1.55;
}
.reset-feedback-success { color: #36573e; background: #edf3e8; }
.reset-feedback-error { color: #8d2929; background: #fdf0ee; }
.reset-login-link {
  display: inline-block;
  margin-top: 1.25rem;
  color: var(--brand-cobalt);
  font-size: 0.78rem;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}
</style>
