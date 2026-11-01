<template>
  <main class="brand-ui min-h-screen bg-[#f7f4ed] px-5 py-8 md:px-12">
    <section class="mx-auto max-w-6xl">
      <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Panel admin</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 class="font-display text-5xl md:text-6xl">Ruang kendali.</h1>
          <p class="mt-3 max-w-xl leading-7 text-[#756a62]">Kelola cerita terbit dan draft. Masuk dengan akun terverifikasi yang emailnya terdaftar sebagai admin.</p>
        </div>
        <button type="button" class="rounded-full border border-[#cbbcb0] px-5 py-3 text-sm" :disabled="loading" @click="load">
          {{ loading ? 'Memuat…' : 'Muat ulang ↻' }}
        </button>
      </div>

      <p v-if="error" class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error }}</p>
      <div class="my-8 grid gap-4 sm:grid-cols-2">
        <article class="admin-stat"><span>Cerita aktif</span><strong>{{ stories.filter(story => story.isActive).length }}</strong></article>
        <article class="admin-stat"><span>Draft tersimpan</span><strong>{{ drafts.length }}</strong></article>
      </div>

      <div class="space-y-10">
        <section>
          <header class="mb-4 flex items-end justify-between gap-4">
            <div><p class="section-kicker mb-1">Publikasi</p><h2 class="font-display text-3xl">Cerita yang terbit</h2></div>
            <span class="text-xs text-[#756a62]">Maksimal 200 terbaru</span>
          </header>
          <div v-if="stories.length" class="grid gap-4 md:grid-cols-2">
            <article v-for="story in stories" :key="story.slug" class="admin-card">
              <img v-if="story.story.heroImage" :src="story.story.heroImage" :alt="story.title" class="h-48 w-full rounded-xl object-cover">
              <div class="mt-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate font-display text-2xl">{{ story.title }}</h3>
                  <p class="mt-1 text-xs text-[#756a62]">{{ story.story.coupleNames }} · {{ formatDate(story.publishedAt) }}</p>
                  <p class="mt-2 text-xs text-[#756a62]">{{ story.passwordProtected ? '🔒 Dilindungi sandi' : '🌐 Publik' }} · {{ templateName(story.story.templateId) }}</p>
                  <p class="mt-2 text-xs font-semibold" :class="story.isActive ? 'text-[#53684b]' : 'text-[#9c6257]'">
                    {{ story.isActive ? 'Aktif' : 'Nonaktif · tidak terlihat secara publik' }}
                  </p>
                </div>
                <button type="button" class="text-xs text-red-700 underline underline-offset-4" @click="deleteStory(story.slug)">Hapus</button>
              </div>
              <div class="mt-4 flex gap-3">
                <NuxtLink v-if="story.isActive" :to="`/w/${story.slug}`" class="rounded-full bg-ink px-4 py-2 text-xs text-white">Buka cerita ↗</NuxtLink>
                <button type="button" class="rounded-full border border-[#cbbcb0] px-4 py-2 text-xs" @click="toggleStory(story)">
                  {{ story.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
                </button>
                <button type="button" class="rounded-full border border-[#cbbcb0] px-4 py-2 text-xs" @click="copyStoryLink(story.slug)">Salin link</button>
              </div>
            </article>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Belum ada cerita yang diterbitkan.</p>
        </section>

        <section>
          <header class="mb-4 flex items-end justify-between gap-4">
            <div><p class="section-kicker mb-1">Penyimpanan</p><h2 class="font-display text-3xl">Draft yang tersimpan</h2></div>
            <span class="text-xs text-[#756a62]">Maksimal 200 terbaru</span>
          </header>
          <div v-if="drafts.length" class="space-y-3">
            <article v-for="draft in drafts" :key="draft.id" class="admin-draft">
              <div class="min-w-0">
                <h3 class="truncate font-semibold">{{ draft.title }}</h3>
                <p class="mt-1 text-xs text-[#756a62]">{{ draft.coupleNames || 'Nama belum diisi' }} · diperbarui {{ formatDate(draft.updatedAt) }}</p>
                <p v-if="draft.publishedSlug" class="mt-1 text-xs text-[#756a62]">Sudah terbit · {{ draft.publishedSlug }}</p>
              </div>
              <button type="button" class="shrink-0 text-xs text-red-700 underline underline-offset-4" @click="deleteDraft(draft.id)">Hapus draft</button>
            </article>
          </div>
          <p v-else class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Belum ada draft.</p>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { storyTemplates, type StoryTemplateId } from '#shared/story-templates'
import type { StoryContent } from '#shared/schema/story'

definePageMeta({ middleware: 'auth' })

interface AdminStory {
  slug: string
  title: string
  story: Pick<StoryContent, 'templateId' | 'coupleNames' | 'heroImage'>
  passwordProtected: boolean
  isActive: boolean
  publishedAt: string
}

interface AdminDraft {
  id: string
  title: string
  coupleNames: string
  publishedSlug: string | null
  createdAt: string
  updatedAt: string
}

const stories = ref<AdminStory[]>([])
const drafts = ref<AdminDraft[]>([])
const adminEmail = ref('')
const error = ref('')
const loading = ref(false)
const confirm = useAppConfirmation()

useSeoMeta({ title: 'Ruang kendali — Selamanya', robots: 'noindex, nofollow' })

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [storyResult, draftResult] = await Promise.all([
      $fetch<{ adminEmail: string, stories: AdminStory[] }>('/api/admin/stories'),
      $fetch<{ drafts: AdminDraft[] }>('/api/admin/drafts'),
    ])
    adminEmail.value = storyResult.adminEmail
    stories.value = storyResult.stories
    drafts.value = draftResult.drafts
  } catch (caught) {
    error.value = caught instanceof Error
      ? `${caught.message}. Pastikan email akunmu termasuk ADMIN_EMAILS.`
      : 'Panel admin belum dapat dimuat.'
  } finally {
    loading.value = false
  }
}

async function deleteStory(slug: string) {
  if (!await confirm({
    title: 'Hapus cerita ini?',
    message: 'Cerita dan tautan publiknya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus cerita',
    tone: 'danger',
  })) return
  try {
    await $fetch(`/api/admin/stories/${slug}`, { method: 'DELETE' })
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Cerita belum berhasil dihapus.'
  }
}

async function toggleStory(story: AdminStory) {
  const active = !story.isActive
  if (!await confirm({
    title: active ? 'Aktifkan cerita?' : 'Nonaktifkan cerita?',
    message: active
      ? 'Cerita ini akan dapat dibuka kembali melalui tautan publik.'
      : 'Cerita ini tidak lagi dapat dibuka melalui tautan publik sampai diaktifkan kembali.',
    confirmLabel: active ? 'Aktifkan cerita' : 'Nonaktifkan',
  })) return
  try {
    await $fetch(`/api/admin/stories/${story.slug}`, {
      method: 'PATCH',
      body: { active },
    })
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Status cerita belum berhasil diubah.'
  }
}

async function deleteDraft(id: string) {
  if (!await confirm({
    title: 'Hapus draft ini?',
    message: 'Isi draft ini akan dihapus permanen dan tidak bisa dipulihkan.',
    confirmLabel: 'Hapus draft',
    tone: 'danger',
  })) return
  try {
    await $fetch(`/api/admin/drafts/${id}`, { method: 'DELETE' })
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Draft belum berhasil dihapus.'
  }
}

async function copyStoryLink(slug: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`)
  } catch {
    error.value = 'Tautan belum bisa disalin. Buka cerita untuk menyalin alamatnya.'
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function templateName(id?: StoryTemplateId) {
  return storyTemplates.find(template => template.id === id)?.name ?? storyTemplates[0].name
}

onMounted(load)
</script>

<style scoped>
.section-kicker {
  color: #5045f5;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.admin-stat,
.admin-card,
.admin-draft {
  border: 1px solid #e7ddd4;
  border-radius: 1.5rem;
  background: #fffdfa;
  box-shadow: 0 12px 40px rgb(35 25 20 / 4%);
}
.admin-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  color: #756a62;
  font-size: 0.8rem;
}
.admin-stat strong { color: #201d28; font-family: 'Instrument Serif', serif; font-size: 2rem; }
.admin-card { padding: 1rem; }
.admin-draft { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; }
</style>
