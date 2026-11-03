<template>
  <main id="main-content" tabindex="-1" class="brand-ui min-h-screen bg-[#f7f4ed] px-5 py-8 md:px-12">
    <section class="mx-auto max-w-6xl">
      <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Panel admin</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 class="font-display text-5xl md:text-6xl">Ruang kendali.</h1>
          <p class="mt-3 max-w-xl leading-7 text-[#756a62]">Kelola cerita terbit dan draft. Masuk dengan akun terverifikasi yang emailnya terdaftar sebagai admin.</p>
        </div>
        <AppButton variant="secondary" :disabled="loading" :loading="loading" @click="load">
          <AppIcon name="refresh" :size="17" />
          {{ loading ? 'Memuat…' : 'Muat ulang' }}
        </AppButton>
      </div>

      <AppErrorAlert v-if="error" class="mt-6" :title="error.title" :message="error.message" :location="error.location" />
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
          <div v-if="loading" class="loading-panel" role="status" aria-live="polite" aria-busy="true">
            <span class="loading-spinner" aria-hidden="true" />Memuat cerita terbit…
          </div>
          <div v-else-if="stories.length" class="grid gap-4 md:grid-cols-2">
            <article v-for="story in stories" :key="story.slug" class="admin-card">
              <img
                v-if="story.story.heroImage && !failedHeroImageSlugs.has(story.slug)"
                :src="story.story.heroImage"
                :alt="story.title"
                class="h-48 w-full rounded-xl object-cover"
                @error="markHeroImageFailed(story.slug)"
              >
              <div
                v-else-if="story.story.heroImage"
                role="img"
                :aria-label="`Foto ${story.title} tidak tersedia`"
                class="grid h-48 place-items-center rounded-xl bg-paper px-4 text-center text-sm text-muted"
              >
                Foto cerita tidak tersedia.
              </div>
              <div class="mt-4 flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate font-display text-2xl">{{ story.title }}</h3>
                  <p class="mt-1 text-xs text-[#756a62]">{{ story.story.coupleNames }} · {{ formatDate(story.publishedAt) }}</p>
                  <p class="mt-2 inline-flex items-center gap-1.5 text-xs text-[#756a62]">
                    <AppIcon :name="story.passwordProtected ? 'lock' : 'globe'" :size="14" />
                    {{ story.passwordProtected ? 'Dilindungi sandi' : 'Publik' }} · {{ templateName(story.story.templateId) }}
                  </p>
                  <p class="mt-2 text-xs font-semibold" :class="story.isActive ? 'text-[#53684b]' : 'text-[#9c6257]'">
                    {{ story.isActive ? 'Aktif' : 'Nonaktif · tidak terlihat secara publik' }}
                  </p>
                </div>
                <AppButton
                  variant="danger"
                  size="sm"
                  :disabled="Boolean(pendingAction)"
                  :loading="pendingAction === `delete-story:${story.slug}`"
                  @click="deleteStory(story.slug)"
                >                <AppIcon name="trash" :size="15" />
                Hapus</AppButton>
              </div>
              <div class="mt-4 flex gap-3">
                <NuxtLink v-if="story.isActive" :to="`/w/${story.slug}`" class="rounded-full bg-ink px-4 py-2 text-xs text-white">Buka cerita ↗</NuxtLink>
                <AppButton
                  variant="secondary"
                  size="sm"
                  :disabled="Boolean(pendingAction)"
                  :loading="pendingAction === `toggle-story:${story.slug}`"
                  @click="toggleStory(story)"
                >
                  {{ story.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
                </AppButton>
                <AppButton
                  variant="ghost"
                  size="sm"
                  :disabled="Boolean(pendingAction) || Boolean(copyingSlug)"
                  :loading="copyingSlug === story.slug"
                  @click="copyStoryLink(story.slug)"
                ><AppIcon name="copy" :size="15" />Salin link</AppButton>
              </div>
            </article>
          </div>
          <p v-else-if="!error" class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Belum ada cerita yang diterbitkan.</p>
        </section>

        <section>
          <header class="mb-4 flex items-end justify-between gap-4">
            <div><p class="section-kicker mb-1">Penyimpanan</p><h2 class="font-display text-3xl">Draft yang tersimpan</h2></div>
            <span class="text-xs text-[#756a62]">Maksimal 200 terbaru</span>
          </header>
          <div v-if="loading" class="loading-panel" role="status" aria-live="polite" aria-busy="true">
            <span class="loading-spinner" aria-hidden="true" />Memuat draft…
          </div>
          <div v-else-if="drafts.length" class="space-y-3">
            <article v-for="draft in drafts" :key="draft.id" class="admin-draft">
              <div class="min-w-0">
                <h3 class="truncate font-semibold">{{ draft.title }}</h3>
                <p class="mt-1 text-xs text-[#756a62]">{{ draft.coupleNames || 'Nama belum diisi' }} · diperbarui {{ formatDate(draft.updatedAt) }}</p>
                <p v-if="draft.publishedSlug" class="mt-1 text-xs text-[#756a62]">Sudah terbit · {{ draft.publishedSlug }}</p>
              </div>
              <AppButton
                variant="danger"
                size="sm"
                class="shrink-0"
                :disabled="Boolean(pendingAction)"
                :loading="pendingAction === `delete-draft:${draft.id}`"
                @click="deleteDraft(draft.id)"
              >              <AppIcon name="trash" :size="15" />
              Hapus draft</AppButton>
            </article>
          </div>
          <p v-else-if="!error" class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Belum ada draft.</p>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import AppButton from '../../components/AppButton.vue'
import { storyTemplates, type StoryTemplateId } from '#shared/story-templates'
import type { StoryContent } from '#shared/schema/story'
import { getUserFacingError, type UserFacingError } from '#shared/utils/user-facing-error'

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
const failedHeroImageSlugs = ref(new Set<string>())
const adminEmail = ref('')
const error = ref<UserFacingError | null>(null)
const loading = ref(true)
const pendingAction = ref('')
const copyingSlug = ref('')
const confirm = useAppConfirmation()
const { success } = useNotifications()

useSeoMeta({ title: 'Ruang kendali — Selamanya', robots: 'noindex, nofollow' })

async function load() {
  loading.value = true
  error.value = null
  try {
    const [storyResult, draftResult] = await Promise.all([
      $fetch<{ adminEmail: string, stories: AdminStory[] }>('/api/admin/stories'),
      $fetch<{ drafts: AdminDraft[] }>('/api/admin/drafts'),
    ])
    adminEmail.value = storyResult.adminEmail
    stories.value = storyResult.stories
    failedHeroImageSlugs.value = new Set()
    drafts.value = draftResult.drafts
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Panel admin belum dapat dimuat',
      fallback: 'Periksa koneksi, lalu coba lagi. Pastikan email akun terdaftar sebagai admin.',
      location: 'Panel admin · Daftar cerita dan draft',
    })
  } finally {
    loading.value = false
  }
}

function markHeroImageFailed(slug: string) {
  failedHeroImageSlugs.value = new Set(failedHeroImageSlugs.value).add(slug)
}

async function deleteStory(slug: string) {
  if (pendingAction.value) return
  if (!await confirm({
    title: 'Hapus cerita ini?',
    message: 'Cerita dan tautan publiknya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.',
    confirmLabel: 'Hapus cerita',
    tone: 'danger',
  })) return
  pendingAction.value = `delete-story:${slug}`
  try {
    await $fetch(`/api/admin/stories/${slug}`, { method: 'DELETE' })
    success('Cerita berhasil dihapus.')
    await load()
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Cerita belum berhasil dihapus',
      fallback: 'Coba lagi. Cerita tersebut belum dihapus.',
      location: 'Panel admin · Cerita terbit',
    })
  } finally {
    pendingAction.value = ''
  }
}

async function toggleStory(story: AdminStory) {
  if (pendingAction.value) return
  const active = !story.isActive
  if (!await confirm({
    title: active ? 'Aktifkan cerita?' : 'Nonaktifkan cerita?',
    message: active
      ? 'Cerita ini akan dapat dibuka kembali melalui tautan publik.'
      : 'Cerita ini tidak lagi dapat dibuka melalui tautan publik sampai diaktifkan kembali.',
    confirmLabel: active ? 'Aktifkan cerita' : 'Nonaktifkan',
  })) return
  pendingAction.value = `toggle-story:${story.slug}`
  try {
    await $fetch(`/api/admin/stories/${story.slug}`, {
      method: 'PATCH',
      body: { active },
    })
    success(active ? 'Cerita berhasil diaktifkan.' : 'Cerita berhasil dinonaktifkan.')
    await load()
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Status cerita belum berubah',
      fallback: 'Coba lagi. Status publikasi cerita masih seperti sebelumnya.',
      location: 'Panel admin · Cerita terbit',
    })
  } finally {
    pendingAction.value = ''
  }
}

async function deleteDraft(id: string) {
  if (pendingAction.value) return
  if (!await confirm({
    title: 'Hapus draft ini?',
    message: 'Isi draft ini akan dihapus permanen dan tidak bisa dipulihkan.',
    confirmLabel: 'Hapus draft',
    tone: 'danger',
  })) return
  pendingAction.value = `delete-draft:${id}`
  try {
    await $fetch(`/api/admin/drafts/${id}`, { method: 'DELETE' })
    success('Draft berhasil dihapus.')
    await load()
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Draft belum berhasil dihapus',
      fallback: 'Coba lagi. Draft tersebut belum dihapus.',
      location: 'Panel admin · Draft tersimpan',
    })
  } finally {
    pendingAction.value = ''
  }
}

async function copyStoryLink(slug: string) {
  if (pendingAction.value || copyingSlug.value) return
  copyingSlug.value = slug
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`)
    success('Tautan cerita berhasil disalin.')
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Link belum bisa disalin',
      fallback: 'Izinkan akses clipboard atau buka cerita untuk menyalin alamatnya.',
      location: 'Panel admin · Cerita terbit',
    })
  } finally {
    copyingSlug.value = ''
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
  transition: transform 220ms var(--motion-ease-standard), border-color 220ms var(--motion-ease-standard), box-shadow 220ms var(--motion-ease-standard);
}
.admin-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  color: #756a62;
  font-size: 0.8rem;
}
.admin-stat:first-child { border-color: rgb(80 69 245 / 18%); background: linear-gradient(135deg, #fffdfa 58%, var(--brand-lavender-soft)); }
.admin-stat:nth-child(2) { border-color: rgb(255 121 104 / 20%); background: linear-gradient(135deg, #fffdfa 58%, var(--brand-peach-soft)); }
.admin-stat strong { color: #201d28; font-family: 'Instrument Serif', serif; font-size: 2rem; }
.admin-card { min-width: 0; padding: 1rem; }
.admin-draft { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; }
.admin-card:hover, .admin-draft:hover { transform: translateY(-2px); border-color: rgb(80 69 245 / 30%); box-shadow: 0 16px 36px rgb(35 25 20 / 8%); }
@media (prefers-reduced-motion: reduce) {
  .admin-stat, .admin-card, .admin-draft { transition: none; }
  .admin-card:hover, .admin-draft:hover { transform: none; }
}
</style>
