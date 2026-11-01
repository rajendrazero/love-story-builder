<template>
  <main class="brand-ui min-h-screen bg-[#f7f4ed] px-5 py-8 md:px-12">
    <section class="mx-auto max-w-2xl rounded-3xl border border-[#e7ddd4] bg-white/80 p-6 shadow-sm md:p-10">
      <NuxtLink to="/" class="font-display text-2xl">selamanya<span class="text-[#9c6257]">.</span></NuxtLink>
      <p class="mt-10 text-xs uppercase tracking-[0.25em] text-[#9c6257]">Setup awal · khusus admin</p>
      <h1 class="mt-3 font-display text-4xl">Siapkan akun.</h1>
      <p class="mt-4 leading-7 text-[#756a62]">
        Halaman ini hanya untuk migrasi awal tabel autentikasi, sebelum akun admin dapat masuk dengan username/email dan password.
        Gunakan Cloudflare Access atau token setup sementara yang disimpan sebagai secret Worker.
      </p>

      <form class="mt-8 grid gap-4" @submit.prevent="migrate">
        <label>
          <span class="editor-label">Token setup sementara</span>
          <input
            id="admin-bootstrap-token"
            v-model="bootstrapToken"
            name="bootstrapToken"
            class="editor-input"
            type="password"
            autocomplete="one-time-code"
            maxlength="512"
            placeholder="Opsional jika halaman dilindungi Cloudflare Access"
          >
          <span class="mt-2 block text-xs text-[#756a62]">Hapus secret token dari Worker setelah setup selesai.</span>
        </label>
        <button
          type="submit"
          class="w-fit rounded-full bg-[#201d28] px-6 py-3 text-sm text-white disabled:opacity-60"
          :disabled="loading || complete"
        >
          {{ loading ? 'Menyiapkan…' : complete ? 'Tabel akun siap' : 'Siapkan tabel akun' }}
        </button>
      </form>
      <p v-if="message" class="mt-5 text-sm text-[#53684b]" role="status">{{ message }}</p>
      <p v-if="error" class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error }}</p>
      <NuxtLink v-if="complete" to="/register" class="mt-6 inline-block text-sm text-[#5045f5] underline underline-offset-4">
        Buat akun admin →
      </NuxtLink>
    </section>
  </main>
</template>

<script setup lang="ts">
useSeoMeta({ title: 'Setup akun admin — Selamanya', robots: 'noindex, nofollow' })

const loading = ref(false)
const complete = ref(false)
const bootstrapToken = ref('')
const message = ref('')
const error = ref('')

async function migrate() {
  loading.value = true
  message.value = ''
  error.value = ''
  try {
    const result = await $fetch<{ migrated: boolean, pending: { create: string[], add: string[] } }>('/api/admin/auth/migrate', {
      method: 'POST',
      headers: bootstrapToken.value ? { 'x-admin-bootstrap-token': bootstrapToken.value } : undefined,
    })
    complete.value = true
    bootstrapToken.value = ''
    message.value = result.migrated
      ? `Migrasi selesai. Tabel baru: ${result.pending.create.join(', ') || 'tidak ada'}.`
      : 'Tabel akun sudah siap dan tidak memerlukan perubahan.'
  } catch (caught) {
    error.value = caught instanceof Error
      ? `${caught.message}. Periksa ADMIN_EMAILS dan token setup atau Cloudflare Access.`
      : 'Migrasi akun belum berhasil.'
  } finally {
    loading.value = false
  }
}
</script>
