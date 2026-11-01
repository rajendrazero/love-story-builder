<template>
  <main ref="studioPage" class="brand-ui min-h-screen bg-paper px-5 py-8 md:px-12">
    <div class="mx-auto max-w-5xl">
      <div class="mb-10 max-w-2xl">
        <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Studio cerita · ruang akunmu</p>
        <h1 class="mt-3 font-display text-5xl md:text-6xl">{{ editingStorySlug ? 'Perbarui cerita kalian.' : 'Rangkai cerita kalian.' }}</h1>
        <p class="mt-4 leading-7 text-[#756a62]">Draft tersimpan di akunmu. Kamu bisa melanjutkan dari perangkat lain, memperbarui cerita terbit, dan hanya kamu serta admin yang bisa mengelolanya.</p>
      </div>

      <div class="mb-8 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <button
          v-for="(step, index) in steps"
          :key="step.title"
          type="button"
          class="step-tab"
          :class="{ 'step-tab-active': activeStep === index, 'step-tab-complete': index < activeStep }"
          @click="goToStep(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <span>{{ step.title }}</span>
        </button>
      </div>

      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7ddd4] bg-white/70 px-4 py-3 text-sm">
        <p class="text-[#756a62]">Draft akun privat · progres tersimpan otomatis</p>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-2 text-xs text-[#756a62]" role="status">
            <span v-if="saveStatus === 'saving' || saveStatus === 'idle'" class="loading-spinner" aria-hidden="true" />
            {{ saveStatus === 'saving' ? 'Menyimpan…' : saveStatus === 'saved' ? `Tersimpan ${lastSavedLabel}` : saveStatus === 'error' ? 'Belum tersimpan ke server' : 'Menyiapkan penyimpanan…' }}
          </span>
          <button type="button" class="text-xs font-semibold text-[#9c6257] underline underline-offset-4" :disabled="savingDraft" @click="saveDraft">
            Simpan sekarang
          </button>
        </div>
      </div>

      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="section-kicker mb-1">Langkah {{ activeStep + 1 }} dari {{ steps.length }}</p>
          <h2 class="font-display text-3xl">{{ steps[activeStep]?.title }}</h2>
        </div>
        <span class="text-xs text-[#756a62]">{{ Math.round(((activeStep + 1) / steps.length) * 100) }}% selesai</span>
      </div>
      <div class="mb-6 h-1.5 overflow-hidden rounded-full bg-[#e7ddd4]">
        <div class="h-full rounded-full bg-[#9c6257] transition-all duration-300" :style="{ width: `${((activeStep + 1) / steps.length) * 100}%` }" />
      </div>

      <div class="space-y-5">
        <section v-show="activeStep === 0" class="editor-card">
          <p class="section-kicker">01 — Pembuka</p>
          <div class="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e3dbd2] p-4">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-[#9c6257]">Template terpilih</p>
              <strong class="mt-1 block font-display text-2xl">{{ selectedTemplate.name }}</strong>
              <p class="mt-1 text-sm text-[#756a62]">{{ selectedTemplate.mood }}</p>
            </div>
          </div>
          <div class="grid gap-5 md:grid-cols-2">
            <label><span class="editor-label">Judul cerita</span><input v-model="draft.title" name="storyTitle" class="editor-input" maxlength="100" required placeholder="Sebuah kisah tentang kita"></label>
            <label><span class="editor-label">Nama kalian</span><input v-model="draft.coupleNames" name="coupleNames" class="editor-input" maxlength="100" required placeholder="Alya & Bima"></label>
            <label><span class="editor-label">Tanggal spesial</span><input v-model="draft.date" name="storyDate" class="editor-input" maxlength="80" required placeholder="Sejak 14 Februari 2022"></label>
            <ImageField v-model="draft.heroImage" label="Foto sampul" />
          </div>
          <div class="mt-6 grid gap-4 rounded-2xl bg-[#f7f4ed] p-5 md:grid-cols-2">
            <template v-if="draft.templateId === 'editorial-rose'">
              <label><span class="editor-label">Dedikasi pada sampul majalah</span><input v-model="draft.templateDetails!.editorialRose!.dedication" name="editorialDedication" class="editor-input" maxlength="180" placeholder="Edisi khusus untuk dua hati"></label>
              <label><span class="editor-label">Tanda tangan penutup</span><input v-model="draft.templateDetails!.editorialRose!.signature" name="editorialSignature" class="editor-input" maxlength="80" placeholder="Dengan cinta, selalu"></label>
            </template>
            <template v-else-if="draft.templateId === 'love-letter'">
              <label><span class="editor-label">Salam pembuka surat</span><input v-model="draft.templateDetails!.editorialRose!.dedication" name="letterDedication" class="editor-input" maxlength="180" placeholder="Untuk orang yang selalu kupilih"></label>
              <label><span class="editor-label">Tanda tangan surat</span><input v-model="draft.templateDetails!.editorialRose!.signature" name="letterSignature" class="editor-input" maxlength="80" placeholder="Dengan cinta, selalu"></label>
            </template>
            <template v-else-if="draft.templateId === 'midnight-cinema'">
              <label><span class="editor-label">Kutipan pembuka film</span><textarea v-model="draft.templateDetails!.midnightCinema!.openingQuote" name="filmOpeningQuote" class="editor-input min-h-24" maxlength="220" placeholder="Setiap kisah punya satu adegan yang ingin diulang."></textarea></label>
              <label><span class="editor-label">Kredit penutup film</span><input v-model="draft.templateDetails!.midnightCinema!.credits" name="filmCredits" class="editor-input" maxlength="120" placeholder="Dibintangi kalian · 2021—selamanya"></label>
            </template>
            <template v-else-if="draft.templateId === 'botanical-journal'">
              <label><span class="editor-label">Label jurnal</span><input v-model="draft.templateDetails!.botanicalJournal!.journalLabel" name="journalLabel" class="editor-input" maxlength="80" placeholder="Catatan perjalanan no. 01"></label>
              <label><span class="editor-label">Catatan lapangan</span><textarea v-model="draft.templateDetails!.botanicalJournal!.fieldNote" name="fieldNote" class="editor-input min-h-24" maxlength="220" placeholder="Bahagia tumbuh dari hal-hal kecil yang dirawat bersama."></textarea></label>
            </template>
          </div>
        </section>

        <section v-show="activeStep === 1" class="editor-card">
          <p class="section-kicker">02 — Kartu ucapan</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.greetingImage" label="Latar kartu" />
            <label><span class="editor-label">Tulisan untuknya</span><textarea v-model="draft.greetingText" name="greetingText" class="editor-input min-h-36" maxlength="1000" required placeholder="Untuk kamu, rumah yang selalu ingin kutuju..." /></label>
            <label class="md:col-span-2"><span class="editor-label">Tautan video latar (opsional)</span><input v-model="draft.greetingVideoUrl" name="greetingVideoUrl" class="editor-input" type="url" placeholder="https://... tautan video MP4 langsung"><span class="mt-2 block text-xs text-muted">Jika diisi, video menggantikan foto pada bagian latar kartu.</span></label>
          </div>
        </section>

        <section v-show="activeStep === 2" class="editor-card">
          <p class="section-kicker">03 — Galeri bergerak</p>
          <div class="space-y-4">
            <div v-for="(photo, index) in draft.gallery" :key="index" class="grid gap-4 rounded-2xl border border-[#e3dbd2] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <ImageField v-model="photo.url" :label="`Foto ${index + 1}`" />
              <label><span class="editor-label">Cerita singkat</span><input v-model="photo.caption" :name="`galleryCaption-${index}`" class="editor-input" maxlength="120" placeholder="Hari pertama kita bertemu"></label>
              <button v-if="draft.gallery.length > 1" type="button" class="pb-3 text-sm text-[#9c6257]" @click="draft.gallery.splice(index, 1)">Hapus</button>
            </div>
            <button v-if="draft.gallery.length < 12" type="button" class="text-sm text-[#9c6257]" @click="draft.gallery.push({ url: '', caption: '' })">+ Tambah foto ke galeri</button>
          </div>
        </section>

        <section v-show="activeStep === 3" class="editor-card">
          <p class="section-kicker">04 — Tentang kalian</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.secondImage" label="Foto berdua" />
            <div class="space-y-5">
              <label><span class="editor-label">Judul momen</span><input v-model="draft.detailTitle" name="detailTitle" class="editor-input" maxlength="100" required placeholder="Semua berawal dari hari itu"></label>
              <label><span class="editor-label">Ceritakan momen kalian</span><textarea v-model="draft.detailText" name="detailText" class="editor-input min-h-28" maxlength="1000" required placeholder="Ceritakan bagaimana perjalanan kalian dimulai..." /></label>
            </div>
          </div>
        </section>

        <section v-show="activeStep === 4" class="editor-card">
          <p class="section-kicker">05 — Buku cerita</p>
          <p class="mb-4 text-sm text-[#756a62]">Setiap bagian menjadi satu halaman dalam buku kenangan kalian.</p>
          <div class="space-y-4">
            <article v-for="(page, index) in draft.storyPages" :key="index" class="grid gap-4 rounded-2xl border border-[#e3dbd2] p-4 md:grid-cols-2">
              <label><span class="editor-label">Halaman {{ index + 1 }} · Judul</span><input v-model="page.title" :name="`storyPageTitle-${index}`" class="editor-input" maxlength="100" required placeholder="Pertemuan pertama"></label>
              <ImageField v-model="page.image" label="Foto halaman" />
              <label class="md:col-span-2"><span class="editor-label">Kisah di halaman ini</span><textarea v-model="page.text" :name="`storyPageText-${index}`" class="editor-input min-h-28" maxlength="1200" required placeholder="Tulis cerita kalian di sini..." /></label>
              <button v-if="draft.storyPages.length > 1" type="button" class="text-left text-sm text-[#9c6257]" @click="draft.storyPages.splice(index, 1)">Hapus halaman</button>
            </article>
            <button v-if="draft.storyPages.length < 8" type="button" class="text-sm text-[#9c6257]" @click="draft.storyPages.push({ title: '', text: '', image: '' })">+ Tambah halaman</button>
          </div>
        </section>

        <section v-show="activeStep === 5" class="editor-card">
          <p class="section-kicker">06 — Pesan terakhir</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.finalImage" label="Foto penutup" />
            <label><span class="editor-label">Pesan untuknya</span><textarea v-model="draft.finalMessage" name="finalMessage" class="editor-input min-h-36" maxlength="1000" required placeholder="Dan jika aku harus memilih lagi, tetap kamu..." /></label>
          </div>
        </section>

        <section v-show="activeStep === 6" class="editor-card">
          <p class="section-kicker">07 — Lagu & privasi</p>
          <div class="grid gap-5 md:grid-cols-2">
            <label>
              <span class="editor-label">Tautan lagu (opsional)</span>
              <input v-model="draft.musicUrl" name="musicUrl" class="editor-input" type="url" placeholder="Spotify, YouTube Music, SoundCloud, atau URL audio">
              <span class="mt-2 block text-xs leading-5 text-muted">Bisa memakai pemutar Spotify, YouTube Music, SoundCloud, atau URL HTTPS audio langsung (MP3/M4A/OGG). Pemutar baru dimuat setelah pengunjung menekan tombol putar agar hemat data.</span>
            </label>
            <label>
              <span class="editor-label">Kursor halaman</span>
              <select v-model="draft.cursorPreset" name="cursorPreset" class="editor-input">
                <option value="ring">Cincin minimal</option>
                <option value="heart">Hati</option>
                <option value="sparkle">Kilau</option>
                <option value="flower">Bunga</option>
                <option value="star">Bintang</option>
                <option value="system">Default perangkat</option>
              </select>
              <span class="mt-2 block text-xs text-muted">Default mengikuti kursor perangkat. Pilihan lain memakai ikon bawaan yang aman.</span>
            </label>
            <label class="md:col-span-2">
              <span class="editor-label">Atur link berbagi singkat (opsional)</span>
              <span class="share-slug-field">
                <span>{{ shareOrigin }}/w/</span>
                <input
                  id="custom-story-link"
                  v-model="customSlug"
                  name="customSlug"
                  class="editor-input"
                  type="text"
                  minlength="3"
                  maxlength="32"
                  pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  placeholder="contoh: kisah-kita"
                  aria-describedby="custom-story-link-hint"
                >
              </span>
              <span id="custom-story-link-hint" class="mt-2 block text-xs leading-5 text-muted">
                3–32 huruf, angka, dan tanda hubung. Link yang dipakai berubah setelah cerita diterbitkan atau diperbarui.
              </span>
            </label>
            <label>
              <span class="editor-label">{{ editingStorySlug ? 'Ubah sandi cerita (opsional)' : 'Sandi cerita (opsional)' }}</span>
              <input v-model="draft.password" name="storyPassword" class="editor-input" type="password" maxlength="128" :placeholder="editingStorySlug ? 'Kosongkan untuk mempertahankan sandi saat ini' : 'Hanya orang dengan sandi yang bisa membuka'">
              <span v-if="editingStorySlug" class="mt-2 block text-xs text-muted">Sandi yang ada tetap berlaku bila kolom dikosongkan.</span>
            </label>
          </div>
          <label v-if="editingStorySlug" class="mt-4 flex items-center gap-2 text-sm text-[#756a62]">
            <input v-model="removePassword" name="removeStoryPassword" type="checkbox">
            Hapus perlindungan sandi pada cerita ini
          </label>
          <p class="mt-3 text-xs leading-5 text-muted">Gunakan tautan berbagi Spotify, YouTube Music, SoundCloud (lagu atau playlist), atau URL HTTPS file audio langsung dari layanan penyimpanan/CDN yang mendukung pemutaran publik. Pemutar hanya dimuat saat tombol putar ditekan. Sandi disimpan sebagai hash, bukan sebagai teks biasa.</p>
        </section>

        <div class="flex flex-col gap-4 pb-14 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" class="rounded-full border border-[#cbbcb0] px-6 py-3 text-sm disabled:opacity-40" :disabled="activeStep === 0" @click="goToStep(activeStep - 1)">← Sebelumnya</button>
          <p v-if="error" class="text-sm text-red-700" role="alert">{{ error }}</p>
          <div class="flex flex-wrap gap-3">
            <button v-if="activeStep < steps.length - 1" type="button" class="rounded-full bg-ink px-7 py-3 text-sm text-white transition hover:bg-[#5045f5]" @click="goToStep(activeStep + 1)">Simpan & lanjut ↗</button>
            <button v-else type="button" class="rounded-full bg-ink px-7 py-3 text-sm text-white transition hover:bg-[#5045f5]" :disabled="savingDraft || saving" @click="openPreview">
              <span v-if="savingDraft || saving" class="loading-spinner mr-2 align-middle" aria-hidden="true" />
              {{ savingDraft || saving ? 'Menyiapkan…' : 'Lihat pratinjau ↗' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="previewOpen" class="fixed inset-0 z-40 overflow-y-auto bg-ink/75 p-4 md:p-8">
        <div class="fixed inset-x-4 top-4 z-50 flex items-center justify-between rounded-full bg-paper px-4 py-2 shadow-lg md:inset-x-10">
          <span class="text-xs font-semibold uppercase tracking-widest text-[#9c6257]">Pratinjau cerita utuh</span>
          <div class="flex items-center gap-3">
            <button type="button" class="text-sm text-muted" @click="previewOpen = false">Kembali ke editor ×</button>
            <button type="button" :disabled="saving" class="rounded-full bg-ink px-5 py-2 text-xs text-white disabled:opacity-50" @click="publish">{{ saving ? 'Menerbitkan…' : 'Konfirmasi & terbitkan ↗' }}</button>
          </div>
        </div>
        <div class="mx-auto max-w-7xl pt-14">
          <StoryExperience v-if="previewStory" :story="previewStory" />
          <p v-if="draft.password" class="mx-auto mt-4 w-fit rounded-full bg-paper px-5 py-3 text-sm text-ink shadow-lg">Cerita ini akan meminta sandi saat dibuka.</p>
          <p v-if="error" class="mt-4 text-sm text-red-700">{{ error }}</p>
        </div>
      </div>

      <div v-if="publishedUrl" class="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-5">
        <div class="w-full max-w-md rounded-3xl bg-paper p-7 text-center shadow-2xl">
          <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Cerita sudah terbit</p>
          <h2 class="mt-2 font-display text-4xl">{{ publishedIsUpdate ? 'Perubahan sudah terbit.' : 'Saatnya dibagikan.' }}</h2>
          <p class="mt-2 break-all text-sm text-muted">{{ publishedUrl }}</p>
          <div class="my-5 flex justify-center"><QrcodeVue :value="publishedUrl" :size="180" level="H" background="#f5f0e9" foreground="#171311" /></div>
          <div class="flex justify-center gap-3">
            <button class="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-white" :disabled="copyingLink" @click="copyLink">
              <span v-if="copyingLink" class="loading-spinner" aria-hidden="true" />
              {{ copyingLink ? 'Menyalin…' : 'Salin tautan' }}
            </button>
            <NuxtLink :to="`/w/${publishedSlug}`" class="rounded-full border border-ink px-5 py-3 text-sm">Lihat cerita</NuxtLink>
          </div>
          <p v-if="copyMessage" class="mt-3 text-sm text-muted" role="status">{{ copyMessage }}</p>
          <button class="mt-5 text-xs text-muted" @click="publishedUrl = ''">Tutup</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { storyContentSchema, type StoryContent } from '#shared/schema/story'
import { storyTemplates } from '#shared/story-templates'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const QrcodeVue = defineAsyncComponent(() => import('qrcode.vue'))
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const studioPage = ref<HTMLElement | null>(null)
let studioMotion: gsap.MatchMedia | undefined
const steps = [
  { title: 'Sampul' },
  { title: 'Ucapan' },
  { title: 'Galeri' },
  { title: 'Momen' },
  { title: 'Bab cerita' },
  { title: 'Penutup' },
  { title: 'Lagu & privasi' },
]
const draft = reactive<StoryContent & { password: string }>({
  templateId: 'editorial-rose',
  cursorPreset: 'system',
  templateDetails: {
    editorialRose: { dedication: '', signature: '' },
    midnightCinema: { openingQuote: '', credits: '' },
    botanicalJournal: { journalLabel: '', fieldNote: '' },
  },
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
const selectedTemplate = computed(() => storyTemplates.find(template => template.id === draft.templateId) ?? storyTemplates[0])
const saving = ref(false)
const savingDraft = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const activeStep = ref(0)
const error = ref('')
const { success, error: notifyError } = useNotifications()
const publishedUrl = ref('')
const publishedSlug = ref('')
const publishedIsUpdate = ref(false)
const previewOpen = ref(false)
const copyMessage = ref('')
const copyingLink = ref(false)
const draftId = ref('')
const editingStorySlug = ref('')
const customSlug = ref('')
const removePassword = ref(false)
const lastSavedAt = ref('')
const previewStory = computed(() => {
  const parsed = storyContentSchema.safeParse(draft)
  return parsed.success ? parsed.data : null
})
const shareOrigin = computed(() => import.meta.client ? window.location.origin : '')
const lastSavedLabel = computed(() => lastSavedAt.value
  ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSavedAt.value))
  : '')
let localDraftRefKey = ''
let localDraftContentKey = ''
let saveTimer: ReturnType<typeof setTimeout> | undefined
let saveQueued = false
let currentSave: Promise<void> | undefined
let isRestoring = false
let stopDraftWatch: (() => void) | undefined
let stopCustomSlugWatch: (() => void) | undefined

function draftPayload() {
  const { password: _password, ...content } = draft
  return {
    ...content,
    activeStep: activeStep.value,
    ...(editingStorySlug.value ? { editingSlug: editingStorySlug.value } : {}),
    customSlug: customSlug.value.trim().toLowerCase() || undefined,
  }
}

function applyStoryContent(content: Partial<StoryContent>) {
  Object.assign(draft, content)
  draft.templateId = content.templateId ?? 'editorial-rose'
  draft.cursorPreset = content.cursorPreset ?? 'system'
  draft.templateDetails = {
    editorialRose: {
      dedication: content.templateDetails?.editorialRose?.dedication ?? '',
      signature: content.templateDetails?.editorialRose?.signature ?? '',
    },
    midnightCinema: {
      openingQuote: content.templateDetails?.midnightCinema?.openingQuote ?? '',
      credits: content.templateDetails?.midnightCinema?.credits ?? '',
    },
    botanicalJournal: {
      journalLabel: content.templateDetails?.botanicalJournal?.journalLabel ?? '',
      fieldNote: content.templateDetails?.botanicalJournal?.fieldNote ?? '',
    },
  }
}

function persistLocalSnapshot() {
  if (!import.meta.client) return
  localStorage.setItem(localDraftContentKey, JSON.stringify({
    draft: draftPayload(),
    activeStep: activeStep.value,
  }))
}

async function ensureDraftRef() {
  if (draftId.value) return
  const ref = await $fetch<{ id: string, updatedAt: string }>('/api/drafts', { method: 'POST' })
  draftId.value = ref.id
  lastSavedAt.value = ref.updatedAt
  localStorage.setItem(localDraftRefKey, JSON.stringify({ id: ref.id }))
}

function saveDraft(): Promise<void> {
  if (currentSave) {
    saveQueued = true
    return currentSave
  }
  currentSave = saveDraftWork()
  return currentSave
}

async function saveDraftWork() {
  if (savingDraft.value) return
  savingDraft.value = true
  saveStatus.value = 'saving'
  try {
    do {
      saveQueued = false
      await ensureDraftRef()
      const saved = await $fetch<{ updatedAt: string }>(`/api/drafts/${draftId.value}`, {
        method: 'PUT',
        body: draftPayload(),
      })
      lastSavedAt.value = saved.updatedAt
      persistLocalSnapshot()
    } while (saveQueued)
    saveStatus.value = 'saved'
    error.value = ''
  } catch (caught) {
    saveStatus.value = 'error'
    error.value = caught instanceof Error ? caught.message : 'Draft belum berhasil disimpan.'
    persistLocalSnapshot()
  } finally {
    savingDraft.value = false
    currentSave = undefined
  }
}

function scheduleSave() {
  if (isRestoring) return
  persistLocalSnapshot()
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void saveDraft(), 700)
}

async function restoreDraft() {
  if (route.query.new === '1') {
    const rawTemplateId = typeof route.query.template === 'string' ? route.query.template : ''
    const templateId = storyContentSchema.shape.templateId.safeParse(rawTemplateId)
    if (!templateId.success) {
      error.value = 'Pilih template yang valid sebelum mulai membuat cerita.'
      await navigateTo('/templates', { replace: true })
      return
    }
    draft.templateId = templateId.data
    await saveDraft()
    if (saveStatus.value === 'error') throw new Error('Draft baru belum tersimpan.')
    await navigateTo(`/studio?draft=${draftId.value}`, { replace: true })
    return
  }
  const savedContent = localStorage.getItem(localDraftContentKey)
  const savedRef = localStorage.getItem(localDraftRefKey)
  const editSlug = typeof route.query.edit === 'string' ? route.query.edit : ''
  const requestedDraftId = typeof route.query.draft === 'string' ? route.query.draft : ''
  const importLegacy = route.query.importLocal === '1'
  if (importLegacy) {
    const legacyContent = localStorage.getItem('selamanya:draft-content')
    if (!legacyContent) {
      error.value = 'Snapshot draft lama tidak ditemukan di browser ini.'
      throw new Error(error.value)
    }
    try {
      const content = JSON.parse(legacyContent) as { draft?: Partial<StoryContent> & { editingSlug?: string, customSlug?: string }, activeStep?: number }
      if (!content.draft) throw new Error('Snapshot draft lama tidak memiliki konten.')
      const { editingSlug: savedEditingSlug, customSlug: savedCustomSlug, ...savedDraft } = content.draft
      applyStoryContent(savedDraft)
      editingStorySlug.value = savedEditingSlug ?? ''
      customSlug.value = savedCustomSlug ?? savedEditingSlug ?? ''
      activeStep.value = Math.max(0, Math.min(steps.length - 1, Number(content.activeStep) || 0))
      await saveDraft()
      if (saveStatus.value === 'error') throw new Error('Draft belum berhasil diimpor dan disimpan.')
      localStorage.removeItem('selamanya:draft-content')
      localStorage.removeItem('selamanya:draft-ref')
      await navigateTo('/studio', { replace: true })
      return
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Snapshot draft lama tidak dapat dibaca.'
      throw new Error(error.value)
    }
  }
  if (editSlug) {
    try {
      const result = await $fetch<{ slug: string, story: StoryContent }>(`/api/account/stories/${editSlug}`)
      applyStoryContent(result.story)
      editingStorySlug.value = result.slug
      customSlug.value = result.slug
      draft.password = ''
      removePassword.value = false
      await saveDraft()
      return
    } catch {
      error.value = 'Cerita tidak ditemukan atau bukan milik akun ini.'
      throw new Error(error.value)
    }
  }

  let savedDraftId = requestedDraftId
  if (!savedDraftId && savedRef) {
    try {
      savedDraftId = (JSON.parse(savedRef) as { id?: string }).id ?? ''
    } catch {
      localStorage.removeItem(localDraftRefKey)
    }
  }
  if (savedDraftId) {
    try {
      const result = await $fetch<{ id: string, draft: Partial<StoryContent> & { activeStep?: number, editingSlug?: string, customSlug?: string }, publishedSlug: string | null, updatedAt: string }>(
        `/api/drafts/${savedDraftId}`,
      )
      if (result.publishedSlug) {
        await navigateTo(`/studio?edit=${result.publishedSlug}`, { replace: true })
        return
      }
      const { activeStep: savedStep, editingSlug: savedEditingSlug, customSlug: savedCustomSlug, ...savedDraft } = result.draft
      applyStoryContent(savedDraft)
      editingStorySlug.value = savedEditingSlug ?? ''
      customSlug.value = savedCustomSlug ?? savedEditingSlug ?? ''
      draftId.value = result.id
      lastSavedAt.value = result.updatedAt
      saveStatus.value = 'saved'
      activeStep.value = Math.max(0, Math.min(steps.length - 1, savedStep ?? 0))
      return
    } catch {
      if (requestedDraftId) {
        error.value = 'Draft tidak ditemukan atau bukan milik akun ini.'
        throw new Error(error.value)
      }
      localStorage.removeItem(localDraftRefKey)
    }
  }

  if (savedContent) {
    try {
      const content = JSON.parse(savedContent) as { draft?: Partial<StoryContent> & { editingSlug?: string, customSlug?: string }, activeStep?: number }
      if (content.draft) {
        const { editingSlug: savedEditingSlug, customSlug: savedCustomSlug, ...savedDraft } = content.draft
        applyStoryContent(savedDraft)
        editingStorySlug.value = savedEditingSlug ?? ''
        customSlug.value = savedCustomSlug ?? savedEditingSlug ?? ''
      }
      activeStep.value = Math.max(0, Math.min(steps.length - 1, Number(content.activeStep) || 0))
    } catch {
      localStorage.removeItem(localDraftContentKey)
    }
  }
  await saveDraft()
}

async function goToStep(index: number) {
  if (index < 0 || index >= steps.length) return
  activeStep.value = index
  if (saveTimer) clearTimeout(saveTimer)
  persistLocalSnapshot()
  await saveDraft()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  isRestoring = true
  void (async () => {
    const user = await $fetch<{ id: string }>('/api/account/me')
    localDraftRefKey = `selamanya:${user.id}:draft-ref`
    localDraftContentKey = `selamanya:${user.id}:draft-content`
    stopDraftWatch = watch(draft, scheduleSave, { deep: true })
    stopCustomSlugWatch = watch(customSlug, scheduleSave)
    await restoreDraft()
  })().catch((caught: unknown) => {
    error.value = caught instanceof Error ? caught.message : 'Draft belum berhasil dimuat.'
    saveStatus.value = 'error'
    notifyError(error.value)
  }).finally(() => {
    isRestoring = false
  })
  const root = studioPage.value
  if (!root) return

  gsap.registerPlugin(ScrollTrigger)
  studioMotion = gsap.matchMedia(root)
  studioMotion.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from(root.querySelectorAll('header, .max-w-2xl'), {
      y: 18,
      autoAlpha: 0,
      duration: 0.65,
      stagger: 0.12,
      ease: 'power2.out',
    })

    root.querySelectorAll<HTMLElement>('.editor-card').forEach((card) => {
      gsap.from(card, {
        y: 20,
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          once: true,
        },
      })
    })
  })
})

function openPreview() {
  if (!previewStory.value) {
    const parsed = storyContentSchema.safeParse(draft)
    error.value = parsed.error?.issues[0]?.message ?? 'Lengkapi semua bagian dan foto sebelum pratinjau.'
    return
  }
  error.value = ''
  void saveDraft()
  previewOpen.value = true
}

async function publish() {
  error.value = ''
  saving.value = true
  try {
    if (saveTimer) clearTimeout(saveTimer)
    await saveDraft()
    if (!draftId.value || saveStatus.value === 'error') {
      throw new Error('Draft belum tersimpan. Periksa koneksi, lalu coba lagi sebelum menerbitkan.')
    }
    const wasEditing = Boolean(editingStorySlug.value)
    const result = await $fetch<{ slug: string }>(
      editingStorySlug.value ? `/api/account/stories/${editingStorySlug.value}` : '/api/stories',
      {
      method: editingStorySlug.value ? 'PUT' : 'POST',
      body: {
        ...draft,
        customSlug: customSlug.value.trim().toLowerCase() || undefined,
        draftId: draftId.value,
        removePassword: removePassword.value,
      },
      },
    )
    publishedSlug.value = result.slug
    publishedIsUpdate.value = wasEditing
    editingStorySlug.value = result.slug
    publishedUrl.value = `${window.location.origin}/w/${result.slug}`
    success('Cerita berhasil diterbitkan dan link berbagi siap digunakan.')
    previewOpen.value = false
    if (localDraftRefKey) localStorage.removeItem(localDraftRefKey)
    if (localDraftContentKey) localStorage.removeItem(localDraftContentKey)
    draftId.value = ''
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Cerita belum berhasil diterbitkan.'
    notifyError(error.value)
  } finally {
    saving.value = false
  }
}

async function copyLink() {
  if (copyingLink.value) return
  copyingLink.value = true
  copyMessage.value = ''
  try {
    await navigator.clipboard.writeText(publishedUrl.value)
    copyMessage.value = 'Tautan berhasil disalin.'
    success(copyMessage.value)
  } catch {
    copyMessage.value = 'Tautan belum bisa disalin. Salin alamat di atas secara manual.'
    notifyError(copyMessage.value)
  } finally {
    copyingLink.value = false
  }
}

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    void saveDraft()
  }
  stopDraftWatch?.()
  stopCustomSlugWatch?.()
  studioMotion?.revert()
})
</script>

<style scoped>
.editor-card {
  border-radius: 1.5rem;
  background: #fffdfa;
  padding: 1.5rem;
  box-shadow: 0 12px 40px rgb(35 25 20 / 4%);
  transition: box-shadow 220ms ease, transform 220ms ease;
}
.editor-card:hover {
  box-shadow: 0 18px 48px rgb(35 25 20 / 8%);
}
.section-kicker {
  margin-bottom: 1.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #5045f5;
}
.share-slug-field {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #ded5cb;
  border-radius: 0.75rem;
  background: #fffdfa;
  padding-left: 0.75rem;
  color: #77727d;
  font-size: 0.85rem;
  white-space: nowrap;
}
.share-slug-field .editor-input {
  min-width: 0;
  border: 0;
  background: transparent;
  padding-left: 0.25rem;
}
.step-tab {
  display: flex;
  min-height: 3.4rem;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid #e3dbd2;
  border-radius: 1rem;
  padding: 0.7rem 0.85rem;
  background: rgb(255 253 250 / 75%);
  color: #756a62;
  font-size: 0.75rem;
  text-align: left;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}
.step-tab span:first-child {
  color: #5045f5;
  font-size: 0.65rem;
  font-weight: 700;
}
.step-tab:hover { transform: translateY(-2px); }
.step-tab-active {
  border-color: #5045f5;
  background: #fffdfa;
  color: #201d28;
  box-shadow: 0 8px 24px rgb(75 44 36 / 9%);
}
.step-tab-complete { border-color: #c8d0b6; }
.template-option {
  display: grid;
  justify-items: start;
  gap: 0.55rem;
  border: 1px solid #e3dbd2;
  border-radius: 1.25rem;
  padding: 1rem;
  background: #fffdfa;
  color: #201d28;
  text-align: left;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}
.template-option:hover { transform: translateY(-2px); }
.template-option-active {
  border-color: var(--template-accent);
  box-shadow: 0 0 0 2px var(--template-accent), 0 12px 28px rgb(35 25 20 / 8%);
}
.template-option strong { font-family: 'Instrument Serif', serif; font-size: 1.35rem; }
.template-option > span:not(.template-swatch) { color: #756a62; font-size: 0.7rem; }
.template-swatch { display: flex; width: 100%; gap: 0.4rem; }
.template-swatch i { height: 2rem; flex: 1; border-radius: 0.55rem; background: var(--template-paper); }
.template-swatch i:nth-child(2) { background: var(--template-accent); }
.template-swatch i:nth-child(3) { background: var(--template-ink); }
.template-check { color: var(--template-accent) !important; font-weight: 700; }
@media (min-width: 768px) {
  .editor-card { padding: 2rem; }
}
</style>
