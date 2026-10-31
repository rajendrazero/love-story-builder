<template>
  <main class="auth-page min-h-screen">
    <header class="auth-topbar">
      <NuxtLink to="/" class="auth-brand">selamanya<span>.</span></NuxtLink>
      <NuxtLink to="/" class="auth-home-link">← Kembali ke beranda</NuxtLink>
    </header>

    <div class="auth-layout">
      <aside class="auth-story-panel" aria-label="Tentang Selamanya">
        <div class="auth-story-copy">
          <p class="auth-overline">Simpan cerita kalian</p>
          <h2>Cerita kecil,<br><em>selamanya.</em></h2>
          <p>Rangkai momen yang berarti menjadi halaman pribadi yang bisa kalian bagikan.</p>
        </div>
        <div class="auth-art" aria-hidden="true">
          <span class="auth-art-orbit auth-art-orbit-one" />
          <span class="auth-art-orbit auth-art-orbit-two" />
          <span class="auth-art-photo">A &amp; B<span>12 JUNI · SELALU</span></span>
          <span class="auth-art-note">our little story ♡</span>
        </div>
        <p class="auth-private-note"><span aria-hidden="true">✳</span> Ruang ceritamu hanya milikmu.</p>
      </aside>

      <section class="auth-card">
        <div class="auth-card-heading">
          <p class="auth-overline">{{ props.mode === 'signup' ? 'Mulai cerita baru' : 'Senang melihatmu kembali' }}</p>
          <h1>{{ props.mode === 'signup' ? 'Buat akun.' : 'Selamat datang.' }}</h1>
          <p class="auth-intro">
            {{ props.mode === 'signup' ? 'Simpan kenangan, kelola halaman, dan bagikan ceritamu kapan saja.' : 'Masuk untuk melanjutkan cerita dan mengelola halamanmu.' }}
          </p>
        </div>

        <nav class="auth-tabs" aria-label="Akun">
          <NuxtLink :to="{ path: '/login', query: route.query }" :aria-current="props.mode === 'signin' ? 'page' : undefined">
            Masuk
          </NuxtLink>
          <NuxtLink :to="{ path: '/register', query: route.query }" :aria-current="props.mode === 'signup' ? 'page' : undefined">
            Daftar
          </NuxtLink>
        </nav>

        <form class="auth-form" @submit.prevent="submit">
          <label v-if="props.mode === 'signup'">
            <span class="editor-label">Nama</span>
            <input v-model="name" class="editor-input" autocomplete="name" maxlength="80" required placeholder="Nama yang ingin ditampilkan">
          </label>
          <label v-if="props.mode === 'signup'">
            <span class="editor-label">Username</span>
            <input v-model="username" class="editor-input" autocomplete="username" minlength="3" maxlength="30" pattern="[A-Za-z0-9_.]+" required placeholder="contoh: ceritakita">
            <span class="auth-hint">3–30 karakter: huruf, angka, titik, atau garis bawah. Username tidak dapat dipakai ulang.</span>
          </label>
          <label>
            <span class="editor-label">{{ props.mode === 'signup' ? 'Alamat email' : 'Username atau email' }}</span>
            <input v-model="identifier" class="editor-input" :type="props.mode === 'signup' ? 'email' : 'text'" :autocomplete="props.mode === 'signup' ? 'email' : 'username'" maxlength="254" required :placeholder="props.mode === 'signup' ? 'kamu@email.com' : 'username atau kamu@email.com'">
          </label>
          <label>
            <span class="editor-label">Kata sandi</span>
            <input v-model="password" class="editor-input" type="password" :autocomplete="props.mode === 'signup' ? 'new-password' : 'current-password'" :minlength="props.mode === 'signup' ? 12 : 1" maxlength="128" required placeholder="••••••••••••">
            <span v-if="props.mode === 'signup'" class="auth-hint">Gunakan minimal 12 karakter untuk menjaga akunmu.</span>
          </label>
          <TurnstileWidget ref="turnstile" v-model="captchaToken" />
          <p v-if="message" class="auth-feedback auth-feedback-success" role="status">{{ message }}</p>
          <p v-if="error" class="auth-feedback auth-feedback-error" role="alert">{{ error }}</p>
          <button class="auth-submit" :disabled="busy || !captchaToken">
            <span>{{ busy ? 'Mohon tunggu…' : props.mode === 'signup' ? 'Buat akun & verifikasi email' : 'Masuk ke akun' }}</span>
            <span aria-hidden="true">↗</span>
          </button>
        </form>

        <button v-if="props.mode === 'signin'" type="button" class="auth-reset" :disabled="busy" @click="sendResetLink">
          Lupa kata sandi?
        </button>
        <p class="auth-privacy">Dengan melanjutkan, kamu menyetujui bahwa email digunakan untuk mengelola dan mengamankan akun.</p>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { createAuthClient } from 'better-auth/vue'
import { usernameClient } from 'better-auth/client/plugins'

const props = defineProps<{
  mode: 'signin' | 'signup'
}>()

const authClient = createAuthClient({ plugins: [usernameClient()] })
const route = useRoute()
const router = useRouter()
const name = ref('')
const username = ref('')
const identifier = ref('')
const password = ref('')
const captchaToken = ref('')
const turnstile = ref<{ reset: () => void } | null>(null)
const busy = ref(false)
const message = ref('')
const error = ref('')

useSeoMeta({
  title: () => props.mode === 'signup' ? 'Daftar — Selamanya' : 'Masuk — Selamanya',
  robots: 'noindex, nofollow',
})

watch(() => props.mode, () => {
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
    if (props.mode === 'signup') {
      const result = await authClient.signUp.email({
        name: name.value.trim(),
        email: identifier.value.trim(),
        username: username.value.trim(),
        password: password.value,
        callbackURL: destination(),
        fetchOptions: { headers: { 'x-captcha-response': captchaToken.value } },
      })
      if (result.error) throw new Error(result.error.message || 'Pendaftaran belum berhasil.')
      message.value = 'Akun dibuat. Buka email untuk verifikasi sebelum masuk.'
      return
    }

    const fetchOptions = { headers: { 'x-captcha-response': captchaToken.value } }
    const result = identifier.value.includes('@')
      ? await authClient.signIn.email({
          email: identifier.value.trim(),
          password: password.value,
          callbackURL: destination(),
          fetchOptions,
        })
      : await authClient.signIn.username({
          username: identifier.value.trim(),
          password: password.value,
          callbackURL: destination(),
          fetchOptions,
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
  if (!identifier.value.includes('@')) {
    error.value = 'Masukkan alamat email akun untuk menerima tautan reset sandi.'
    return
  }
  if (!captchaToken.value) {
    error.value = 'Selesaikan pemeriksaan manusia sebelum meminta tautan reset.'
    return
  }
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    const result = await authClient.requestPasswordReset({
      email: identifier.value.trim(),
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

<style scoped>
.auth-page {
  min-height: 100svh;
  padding: 1.25rem clamp(1.25rem, 5vw, 5rem) 2rem;
  background:
    radial-gradient(ellipse at 12% 12%, rgb(216 243 106 / 18%), transparent 32rem),
    var(--brand-paper);
}
.auth-topbar {
  display: flex;
  max-width: 90rem;
  height: 3.5rem;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}
.auth-brand {
  color: var(--brand-ink);
  font-family: 'Instrument Serif', serif;
  font-size: 1.8rem;
  text-decoration: none;
}
.auth-brand span { color: var(--brand-cobalt); }
.auth-home-link {
  color: var(--brand-muted);
  font-size: 0.78rem;
  text-decoration: none;
}
.auth-layout {
  display: grid;
  width: min(100%, 74rem);
  min-height: min(46rem, calc(100svh - 7rem));
  grid-template-columns: 1fr minmax(22rem, 0.84fr);
  align-items: center;
  gap: clamp(2rem, 8vw, 8rem);
  margin: 1rem auto 0;
}
.auth-story-panel {
  position: relative;
  display: flex;
  min-height: 38rem;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid rgb(216 243 106 / 18%);
  border-radius: 2rem;
  padding: clamp(2rem, 5vw, 4.5rem);
  background:
    radial-gradient(ellipse at 82% 72%, rgb(80 69 245 / 48%), transparent 50%),
    radial-gradient(ellipse at 16% 12%, rgb(216 243 106 / 20%), transparent 38%),
    var(--brand-ink);
}
.auth-story-copy { position: relative; z-index: 1; }
.auth-story-panel .auth-overline { color: var(--brand-lime); }
.auth-overline {
  margin: 0;
  color: var(--brand-cobalt);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.auth-story-copy h2 {
  margin: 1.15rem 0 0;
  color: var(--brand-paper);
  font-family: 'Instrument Serif', serif;
  font-size: clamp(3.6rem, 7vw, 6.5rem);
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 0.9;
}
.auth-story-copy h2 em { color: var(--brand-lime); font-weight: 400; }
.auth-story-copy > p:last-child {
  max-width: 23rem;
  margin: 1.4rem 0 0;
  color: rgb(247 244 237 / 76%);
  font-size: 0.95rem;
  line-height: 1.8;
}
.auth-art {
  position: relative;
  display: grid;
  min-height: 17rem;
  place-items: center;
}
.auth-art-orbit {
  position: absolute;
  width: 16rem;
  height: 16rem;
  border: 1px solid rgb(216 243 106 / 28%);
  border-radius: 50%;
}
.auth-art-orbit-one { transform: rotate(-24deg) scaleX(0.74); }
.auth-art-orbit-two { transform: rotate(38deg) scaleX(0.74); }
.auth-art-photo {
  position: relative;
  display: flex;
  width: 12.5rem;
  height: 15rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 0.65rem solid var(--brand-paper);
  padding-top: 1rem;
  color: var(--brand-paper);
  background:
    linear-gradient(160deg, rgb(32 29 40 / 5%), rgb(32 29 40 / 64%)),
    linear-gradient(135deg, var(--brand-cobalt), #201d28);
  box-shadow: 0 1.5rem 3rem rgb(0 0 0 / 28%);
  font-family: 'Instrument Serif', serif;
  font-size: 3rem;
  transform: rotate(-7deg);
}
.auth-art-photo span {
  position: absolute;
  bottom: 0.45rem;
  color: var(--brand-muted);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.48rem;
  letter-spacing: 0.15em;
}
.auth-art-note {
  position: absolute;
  right: 4%;
  bottom: 17%;
  border-radius: 999px;
  padding: 0.8rem 1rem;
  color: var(--brand-ink);
  background: var(--brand-lime);
  box-shadow: 0 0.7rem 2rem rgb(0 0 0 / 18%);
  font-family: 'Instrument Serif', serif;
  font-size: 1.15rem;
  transform: rotate(6deg);
}
.auth-private-note {
  position: relative;
  z-index: 1;
  margin: 0;
  color: rgb(247 244 237 / 78%);
  font-size: 0.76rem;
}
.auth-private-note span { margin-right: 0.5rem; color: var(--brand-lime); }
.auth-card {
  width: 100%;
  max-width: 28rem;
  justify-self: center;
  border: 1px solid #e5e1d8;
  border-radius: 1.75rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  background: rgb(255 253 250 / 94%);
  box-shadow: 0 1.5rem 5rem rgb(32 29 40 / 10%);
}
.auth-card-heading h1 {
  margin: 0.45rem 0 0;
  color: var(--brand-ink);
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2.8rem, 5vw, 3.6rem);
  font-weight: 400;
  letter-spacing: -0.04em;
  line-height: 1;
}
.auth-intro {
  margin: 0.7rem 0 0;
  color: var(--brand-muted);
  font-size: 0.86rem;
  line-height: 1.7;
}
.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  margin: 1.6rem 0 1.35rem;
  border-radius: 999px;
  padding: 0.3rem;
  background: #eeecf9;
}
.auth-tabs a {
  border-radius: 999px;
  padding: 0.7rem;
  color: var(--brand-muted);
  font-size: 0.8rem;
  text-align: center;
  text-decoration: none;
  transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}
.auth-tabs a[aria-current='page'] {
  color: var(--brand-ink);
  background: #fffdfa;
  box-shadow: 0 2px 8px rgb(32 29 40 / 8%);
  font-weight: 700;
}
.auth-form { display: grid; gap: 1rem; }
.auth-form .editor-label { color: var(--brand-ink); }
.auth-form .editor-input { min-height: 3.1rem; }
.auth-hint {
  display: block;
  margin-top: 0.5rem;
  color: var(--brand-muted);
  font-size: 0.7rem;
}
.auth-submit {
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
  transition: background 180ms ease, transform 180ms ease, opacity 180ms ease;
}
.auth-submit:hover:not(:disabled) { background: #4038cc; transform: translateY(-1px); }
.auth-submit:disabled { cursor: not-allowed; opacity: 0.5; }
.auth-feedback {
  margin: 0;
  border-radius: 0.9rem;
  padding: 0.8rem 0.9rem;
  font-size: 0.78rem;
  line-height: 1.55;
}
.auth-feedback-success { color: #36573e; background: #edf3e8; }
.auth-feedback-error { color: #8d2929; background: #fdf0ee; }
.auth-reset {
  margin-top: 1rem;
  border: 0;
  padding: 0;
  color: var(--brand-cobalt);
  background: transparent;
  font-size: 0.76rem;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}
.auth-reset:disabled { opacity: 0.5; }
.auth-privacy {
  margin: 1.5rem 0 0;
  border-top: 1px solid #eee6de;
  padding-top: 1rem;
  color: #897e76;
  font-size: 0.66rem;
  line-height: 1.6;
}
@media (max-width: 800px) {
  .auth-page { padding-inline: 1.1rem; }
  .auth-layout {
    min-height: 0;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    margin-top: 1.25rem;
  }
  .auth-story-panel {
    min-height: 15rem;
    border-radius: 1.5rem;
    padding: 1.5rem;
  }
  .auth-story-copy h2 { font-size: clamp(3.1rem, 12vw, 4rem); }
  .auth-story-copy > p:last-child { max-width: 21rem; font-size: 0.82rem; }
  .auth-art { position: absolute; right: 1rem; bottom: 0; width: 8rem; min-height: 0; height: 10rem; opacity: 0.5; }
  .auth-art-orbit { width: 7rem; height: 7rem; }
  .auth-art-photo { width: 5.3rem; height: 7rem; border-width: 0.35rem; font-size: 1.6rem; }
  .auth-art-photo span { bottom: 0.2rem; font-size: 0.25rem; }
  .auth-art-note, .auth-private-note { display: none; }
  .auth-card { max-width: 34rem; }
}
@media (max-width: 420px) {
  .auth-home-link { font-size: 0.7rem; }
  .auth-story-panel { min-height: 13.5rem; }
  .auth-story-copy h2 { font-size: 3rem; }
}
</style>
