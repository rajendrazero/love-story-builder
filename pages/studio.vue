<template>
  <main class="min-h-screen bg-paper px-5 py-8 md:px-12">
    <header class="mx-auto mb-10 flex max-w-5xl items-center justify-between">
      <NuxtLink to="/" class="font-display text-2xl">selamanya<span class="text-[#9c6257]">.</span></NuxtLink>
      <div class="flex items-center gap-5">
        <NuxtLink to="/preview" class="text-sm text-[#9c6257] hover:text-ink">Lihat contoh ↗</NuxtLink>
        <NuxtLink to="/" class="text-sm text-muted hover:text-ink">← Kembali</NuxtLink>
      </div>
    </header>
    <div class="mx-auto max-w-5xl">
      <div class="mb-10 max-w-2xl">
        <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Studio cerita · Template 01</p>
        <h1 class="mt-3 font-display text-5xl md:text-6xl">Rangkai cerita kalian.</h1>
        <p class="mt-4 leading-7 text-[#756a62]">Isi setiap bagian dengan kata dan gambar yang kalian suka. Foto akan diunggah ke Cloudinary; cerita baru terbit setelah kamu mengonfirmasi.</p>
      </div>

      <form class="space-y-5" @submit.prevent="openPreview">
        <section class="editor-card">
          <p class="section-kicker">01 — Pembuka</p>
          <div class="grid gap-5 md:grid-cols-2">
            <label><span class="editor-label">Judul cerita</span><input v-model="draft.title" class="editor-input" maxlength="100" required placeholder="Sebuah kisah tentang kita"></label>
            <label><span class="editor-label">Nama kalian</span><input v-model="draft.coupleNames" class="editor-input" maxlength="100" required placeholder="Alya & Bima"></label>
            <label><span class="editor-label">Tanggal spesial</span><input v-model="draft.date" class="editor-input" maxlength="80" required placeholder="Sejak 14 Februari 2022"></label>
            <ImageField v-model="draft.heroImage" label="Foto sampul" />
          </div>
        </section>

        <section class="editor-card">
          <p class="section-kicker">02 — Kartu ucapan</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.greetingImage" label="Latar kartu" />
            <label><span class="editor-label">Tulisan untuknya</span><textarea v-model="draft.greetingText" class="editor-input min-h-36" maxlength="1000" required placeholder="Untuk kamu, rumah yang selalu ingin kutuju..." /></label>
            <label class="md:col-span-2"><span class="editor-label">Tautan video latar (opsional)</span><input v-model="draft.greetingVideoUrl" class="editor-input" type="url" placeholder="https://... tautan video MP4 langsung"><span class="mt-2 block text-xs text-muted">Jika diisi, video menggantikan foto pada bagian latar kartu.</span></label>
          </div>
        </section>

        <section class="editor-card">
          <p class="section-kicker">03 — Galeri bergerak</p>
          <div class="space-y-4">
            <div v-for="(photo, index) in draft.gallery" :key="index" class="grid gap-4 rounded-2xl border border-[#e3dbd2] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <ImageField v-model="photo.url" :label="`Foto ${index + 1}`" />
              <label><span class="editor-label">Cerita singkat</span><input v-model="photo.caption" class="editor-input" maxlength="120" placeholder="Hari pertama kita bertemu"></label>
              <button v-if="draft.gallery.length > 1" type="button" class="pb-3 text-sm text-[#9c6257]" @click="draft.gallery.splice(index, 1)">Hapus</button>
            </div>
            <button v-if="draft.gallery.length < 12" type="button" class="text-sm text-[#9c6257]" @click="draft.gallery.push({ url: '', caption: '' })">+ Tambah foto ke galeri</button>
          </div>
        </section>

        <section class="editor-card">
          <p class="section-kicker">04 — Tentang kalian</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.secondImage" label="Foto berdua" />
            <div class="space-y-5">
              <label><span class="editor-label">Judul momen</span><input v-model="draft.detailTitle" class="editor-input" maxlength="100" required placeholder="Semua berawal dari hari itu"></label>
              <label><span class="editor-label">Ceritakan momen kalian</span><textarea v-model="draft.detailText" class="editor-input min-h-28" maxlength="1000" required placeholder="Ceritakan bagaimana perjalanan kalian dimulai..." /></label>
            </div>
          </div>
        </section>

        <section class="editor-card">
          <p class="section-kicker">05 — Buku cerita</p>
          <p class="mb-4 text-sm text-[#756a62]">Setiap bagian menjadi satu halaman dalam buku kenangan kalian.</p>
          <div class="space-y-4">
            <article v-for="(page, index) in draft.storyPages" :key="index" class="grid gap-4 rounded-2xl border border-[#e3dbd2] p-4 md:grid-cols-2">
              <label><span class="editor-label">Halaman {{ index + 1 }} · Judul</span><input v-model="page.title" class="editor-input" maxlength="100" required placeholder="Pertemuan pertama"></label>
              <ImageField v-model="page.image" label="Foto halaman" />
              <label class="md:col-span-2"><span class="editor-label">Kisah di halaman ini</span><textarea v-model="page.text" class="editor-input min-h-28" maxlength="1200" required placeholder="Tulis cerita kalian di sini..." /></label>
              <button v-if="draft.storyPages.length > 1" type="button" class="text-left text-sm text-[#9c6257]" @click="draft.storyPages.splice(index, 1)">Hapus halaman</button>
            </article>
            <button v-if="draft.storyPages.length < 8" type="button" class="text-sm text-[#9c6257]" @click="draft.storyPages.push({ title: '', text: '', image: '' })">+ Tambah halaman</button>
          </div>
        </section>

        <section class="editor-card">
          <p class="section-kicker">06 — Pesan terakhir</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.finalImage" label="Foto penutup" />
            <label><span class="editor-label">Pesan untuknya</span><textarea v-model="draft.finalMessage" class="editor-input min-h-36" maxlength="1000" required placeholder="Dan jika aku harus memilih lagi, tetap kamu..." /></label>
          </div>
        </section>

        <section class="editor-card">
          <p class="section-kicker">07 — Lagu & privasi</p>
          <div class="grid gap-5 md:grid-cols-2">
            <label><span class="editor-label">Tautan lagu (opsional)</span><input v-model="draft.musicUrl" class="editor-input" type="url" placeholder="https://... tautan audio langsung"></label>
            <label><span class="editor-label">Sandi cerita (opsional)</span><input v-model="draft.password" class="editor-input" type="password" maxlength="128" placeholder="Hanya orang dengan sandi yang bisa membuka"></label>
          </div>
          <p class="mt-3 text-xs leading-5 text-muted">Tautan lagu harus berupa URL audio langsung. Sandi disimpan sebagai hash, bukan sebagai teks biasa.</p>
        </section>

        <div class="flex flex-col gap-4 pb-14 sm:flex-row sm:items-center">
          <button type="submit" class="rounded-full bg-ink px-8 py-4 text-sm text-white transition hover:bg-[#9c6257]">Lihat pratinjau & konfirmasi ↗</button>
          <p v-if="error" class="text-sm text-red-700">{{ error }}</p>
        </div>
      </form>

      <div v-if="previewOpen" class="fixed inset-0 z-40 overflow-y-auto bg-ink/75 p-4 md:p-8">
        <div class="mx-auto max-w-4xl rounded-3xl bg-paper p-6 md:p-10">
          <div class="flex items-start justify-between gap-5">
            <div><p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Pratinjau sebelum terbit</p><h2 class="mt-2 font-display text-4xl">{{ draft.title }}</h2></div>
            <button type="button" class="text-sm text-muted" @click="previewOpen = false">Kembali ke editor ×</button>
          </div>
          <img :src="draft.heroImage" :alt="draft.coupleNames" class="mt-6 h-64 w-full rounded-2xl object-cover md:h-96">
          <p class="mt-4 font-display text-3xl">{{ draft.coupleNames }} <span class="text-muted">· {{ draft.date }}</span></p>
          <div class="mt-8 grid gap-5 md:grid-cols-2">
            <img :src="draft.greetingImage" alt="Latar kartu" class="h-52 w-full rounded-2xl object-cover">
            <p class="self-center whitespace-pre-line font-display text-2xl leading-relaxed">{{ draft.greetingText }}</p>
          </div>
          <div class="mt-8 grid gap-3 sm:grid-cols-3">
            <figure v-for="(photo, index) in draft.gallery" :key="index"><img :src="photo.url" :alt="photo.caption" class="h-40 w-full rounded-xl object-cover"><figcaption class="mt-2 text-sm">{{ photo.caption || `Foto ${index + 1}` }}</figcaption></figure>
          </div>
          <div class="mt-8 border-t border-[#ded5cb] pt-6">
            <p class="text-xs uppercase tracking-[0.2em] text-[#9c6257]">Buku cerita · {{ draft.storyPages.length }} halaman</p>
            <p v-for="page in draft.storyPages" :key="page.title" class="mt-3 font-display text-2xl">{{ page.title }}</p>
            <p class="mt-5 whitespace-pre-line leading-7 text-[#756a62]">{{ draft.finalMessage }}</p>
          </div>
          <p v-if="draft.password" class="mt-5 text-sm text-muted">Cerita ini akan meminta sandi saat dibuka.</p>
          <p v-if="error" class="mt-4 text-sm text-red-700">{{ error }}</p>
          <button type="button" :disabled="saving" class="mt-7 rounded-full bg-ink px-8 py-4 text-sm text-white disabled:opacity-50" @click="publish">{{ saving ? 'Menerbitkan...' : 'Konfirmasi & terbitkan ↗' }}</button>
        </div>
      </div>

      <div v-if="publishedUrl" class="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5">
        <div class="w-full max-w-md rounded-3xl bg-paper p-7 text-center shadow-2xl">
          <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Cerita sudah terbit</p>
          <h2 class="mt-2 font-display text-4xl">Saatnya dibagikan.</h2>
          <p class="mt-2 break-all text-sm text-muted">{{ publishedUrl }}</p>
          <div class="my-5 flex justify-center"><QrcodeVue :value="publishedUrl" :size="180" level="H" background="#f5f0e9" foreground="#171311" /></div>
          <div class="flex justify-center gap-3">
            <button class="rounded-full bg-ink px-5 py-3 text-sm text-white" @click="copyLink">Salin tautan</button>
            <NuxtLink :to="`/w/${publishedSlug}`" class="rounded-full border border-ink px-5 py-3 text-sm">Lihat cerita</NuxtLink>
          </div>
          <button class="mt-5 text-xs text-muted" @click="publishedUrl = ''">Tutup</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { storyContentSchema, type StoryContent } from '#shared/schema/story'

const QrcodeVue = defineAsyncComponent(() => import('qrcode.vue'))
const draft = reactive<StoryContent & { password: string }>({
  title: '',
  coupleNames: '',
  date: '',
  heroImage: '',
  greetingImage: '',
  greetingVideoUrl: '',
  greetingText: '',
  gallery: [{ url: '', caption: '' }, { url: '', caption: '' }],
  secondImage: '',
  detailTitle: '',
  detailText: '',
  storyPages: [{ title: '', text: '', image: '' }],
  finalImage: '',
  finalMessage: '',
  musicUrl: '',
  password: '',
})
const saving = ref(false)
const error = ref('')
const publishedUrl = ref('')
const publishedSlug = ref('')
const previewOpen = ref(false)

function openPreview() {
  const parsed = storyContentSchema.safeParse(draft)
  if (!parsed.success) {
    error.value = parsed.error.issues[0]?.message ?? 'Periksa kembali isi cerita.'
    return
  }
  error.value = ''
  previewOpen.value = true
}

async function publish() {
  error.value = ''
  saving.value = true
  try {
    const result = await $fetch<{ slug: string }>('/api/stories', {
      method: 'POST',
      body: draft,
    })
    publishedSlug.value = result.slug
    publishedUrl.value = `${window.location.origin}/w/${result.slug}`
    previewOpen.value = false
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Cerita belum berhasil diterbitkan.'
  } finally {
    saving.value = false
  }
}

async function copyLink() {
  await navigator.clipboard.writeText(publishedUrl.value)
}
</script>

<style scoped>
.editor-card {
  border-radius: 1.5rem;
  background: #fffdfa;
  padding: 1.5rem;
  box-shadow: 0 12px 40px rgb(35 25 20 / 4%);
}
.section-kicker {
  margin-bottom: 1.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #9c6257;
}
@media (min-width: 768px) {
  .editor-card { padding: 2rem; }
}
</style>
