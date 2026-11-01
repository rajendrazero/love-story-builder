<template>
  <main id="main-content" tabindex="-1" class="brand-ui min-h-screen bg-background px-5 py-8 md:px-12">
    <section class="mx-auto max-w-6xl">
      <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Akun Selamanya</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 class="font-display text-5xl md:text-6xl">Halaman kalian.</h1>
          <p class="mt-3 text-sm text-[#756a62]">{{ user?.name }} · {{ user?.email }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink to="/templates" class="rounded-full bg-[#5045f5] px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-[#3e35d6]">
            Buat cerita ↗
          </NuxtLink>
          <AppButton variant="secondary" :disabled="loading" :loading="loading" @click="load">
            {{ loading ? 'Memuat…' : 'Muat ulang ↻' }}
          </AppButton>
        </div>
      </div>

      <p v-if="error" class="mt-6 rounded-2xl border border-destructive bg-destructive-surface p-4 text-sm text-destructive" role="alert">{{ error }}</p>
      <AppButton variant="secondary" size="sm" class="my-5" :disabled="signingOut" :loading="signingOut" @click="signOut">
        {{ signingOut ? 'Keluar…' : 'Keluar dari akun' }}
      </AppButton>
      <div v-if="hasLegacyDraft" class="my-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d6c9bf] bg-white/70 p-4">
        <p class="max-w-2xl text-sm leading-6 text-[#756a62]">Ada snapshot draft lama di browser ini. Impor hanya jika draft tersebut memang milikmu; setelah disimpan, draft menjadi milik akun ini.</p>
        <NuxtLink to="/studio?importLocal=1" class="rounded-full border border-[#cbbcb0] px-5 py-3 text-xs">Tinjau & impor draft</NuxtLink>
      </div>
      <div class="my-8 grid gap-4 sm:grid-cols-2">
        <article class="account-stat"><span>Cerita aktif</span><strong>{{ stories.filter(story => story.isActive).length }}</strong></article>
        <article class="account-stat"><span>Draft</span><strong>{{ drafts.length }}</strong></article>
      </div>

      <section class="mb-10">
        <header class="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div><p class="section-kicker mb-1">Milik akunmu</p><h2 class="font-display text-3xl">Cerita yang terbit</h2></div>
          <span class="text-xs text-[#756a62]">Hanya kamu dan admin yang dapat mengelolanya.</span>
        </header>
        <div v-if="loading" class="loading-panel" role="status"><span class="loading-spinner" />Memuat data akun…</div>
        <div v-else-if="stories.length" class="grid gap-4 md:grid-cols-2">
          <article v-for="story in stories" :key="story.slug" class="account-card">
            <img v-if="story.story.heroImage" :src="story.story.heroImage" :alt="story.title" class="h-48 w-full rounded-xl object-cover">
            <h3 class="mt-4 font-display text-2xl">{{ story.title }}</h3>
            <p class="mt-1 text-xs text-[#756a62]">{{ story.story.coupleNames }} · {{ formatDate(story.publishedAt) }}</p>
            <p class="mt-2 text-xs text-[#756a62]">{{ story.passwordProtected ? '🔒 Dengan sandi' : '🌐 Publik' }}</p>
            <p class="mt-2 text-xs font-semibold" :class="story.isActive ? 'text-[#53684b]' : 'text-[#9c6257]'">
              {{ story.isActive ? 'Aktif · dapat dibuka melalui link' : 'Nonaktif · link publik disembunyikan' }}
            </p>
            <div class="mt-4 flex flex-wrap gap-2">
              <NuxtLink v-if="story.isActive" :to="`/w/${story.slug}`" class="rounded-full bg-[#201d28] px-4 py-2 text-xs text-white">Buka ↗</NuxtLink>
              <NuxtLink :to="`/studio?edit=${story.slug}`" class="rounded-full border border-[#cbbcb0] px-4 py-2 text-xs">Edit</NuxtLink>
              <AppButton variant="secondary" size="sm" :disabled="Boolean(pendingAction)" :loading="pendingAction === `toggle-story:${story.slug}`" @click="toggleStory(story)">
                {{ pendingAction === `toggle-story:${story.slug}` ? 'Memproses…' : story.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
              </AppButton>
              <AppButton variant="danger" size="sm" :disabled="Boolean(pendingAction)" :loading="pendingAction === `delete-story:${story.slug}`" @click="deleteStory(story.slug)">
                {{ pendingAction === `delete-story:${story.slug}` ? 'Menghapus…' : 'Hapus' }}
              </AppButton>
              <AppButton variant="secondary" size="sm" :disabled="Boolean(pendingAction)" :loading="pendingAction === `copy-story:${story.slug}`" @click="copyLink(story.slug)">
                {{ pendingAction === `copy-story:${story.slug}` ? 'Menyalin…' : 'Salin link' }}
              </AppButton>
            </div>
          </article>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Cerita terbitmu akan muncul di sini.</p>
      </section>

      <section>
        <header class="mb-4 flex items-end justify-between gap-4">
          <div><p class="section-kicker mb-1">Autosave</p><h2 class="font-display text-3xl">Draft yang tersimpan</h2></div>
        </header>
        <div v-if="loading" class="loading-panel" role="status"><span class="loading-spinner" />Memuat draft…</div>
        <div v-else-if="drafts.length" class="space-y-3">
          <article v-for="draft in drafts" :key="draft.id" class="account-draft">
            <div class="min-w-0">
              <h3 class="truncate font-semibold">{{ draft.title }}</h3>
              <p class="mt-1 text-xs text-[#756a62]">{{ draft.coupleNames || 'Nama belum diisi' }} · disimpan {{ formatDate(draft.updatedAt) }}</p>
              <p v-if="draft.publishedSlug" class="mt-1 text-xs text-[#756a62]">Terkait cerita terbit · {{ draft.publishedSlug }}</p>
            </div>
            <div class="flex shrink-0 gap-3">
              <NuxtLink :to="draft.publishedSlug ? `/studio?edit=${draft.publishedSlug}` : `/studio?draft=${draft.id}`" class="text-xs text-[#9c6257] underline underline-offset-4">
                {{ draft.publishedSlug ? 'Edit cerita' : 'Lanjutkan' }}
              </NuxtLink>
              <AppButton variant="ghost" size="sm" :disabled="Boolean(pendingAction)" :loading="pendingAction === `delete-draft:${draft.id}`" @click="deleteDraft(draft.id)">
                {{ pendingAction === `delete-draft:${draft.id}` ? 'Menghapus…' : 'Hapus' }}
              </AppButton>
            </div>
          </article>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Draft otomatis tersimpan di sini.</p>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import AppButton from '../components/AppButton.vue'
import { createAuthClient } from 'better-auth/vue'
import type { StoryContent } from '#shared/schema/story'

definePageMeta({ middleware: 'auth' })
useSeoMeta({ title: 'Akun — Selamanya', robots: 'noindex, nofollow' })

interface AccountStory {
  slug: string
  title: string
  story: Pick<StoryContent, 'templateId' | 'coupleNames' | 'heroImage'>
  passwordProtected: boolean
  isActive: boolean
  publishedAt: string
}

interface AccountDraft {
  id: string
  title: string
  coupleNames: string
  publishedSlug: string | null
  updatedAt: string
}

const authClient = createAuthClient()
const confirm = useAppConfirmation()
const { success, error: notifyError } = useNotifications()
const user = ref<{ id: string, name: string, email: string }>()
const stories = ref<AccountStory[]>([])
const drafts = ref<AccountDraft[]>([])
const error = ref('')
const loading = ref(false)
const signingOut = ref(false)
const pendingAction = ref('')
const hasLegacyDraft = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [profile, storyResult, draftResult] = await Promise.all([
      $fetch<{ id: string, name: string, email: string }>('/api/account/me'),
      $fetch<{ stories: AccountStory[] }>('/api/account/stories'),
      $fetch<{ drafts: AccountDraft[] }>('/api/drafts'),
    ])
    user.value = profile
    stories.value = storyResult.stories
    drafts.value = draftResult.drafts
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Data akun belum dapat dimuat.'
    notifyError(error.value)
  } finally {
    loading.value = false
  }
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
    await $fetch(`/api/account/stories/${slug}`, { method: 'DELETE' })
    success('Cerita berhasil dihapus.')
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Cerita belum berhasil dihapus.'
    notifyError(error.value)
  } finally {
    pendingAction.value = ''
  }
}

async function toggleStory(story: AccountStory) {
  if (pendingAction.value) return
  const active = !story.isActive
  if (!await confirm({
    title: active ? 'Aktifkan cerita?' : 'Nonaktifkan cerita?',
    message: active
      ? 'Tautan publik cerita ini akan dapat dibuka kembali.'
      : 'Tautan publik cerita ini tidak lagi dapat dibuka sampai kamu mengaktifkannya kembali.',
    confirmLabel: active ? 'Aktifkan cerita' : 'Nonaktifkan',
  })) return
  pendingAction.value = `toggle-story:${story.slug}`
  try {
    await $fetch(`/api/account/stories/${story.slug}`, {
      method: 'PATCH',
      body: { active },
    })
    success(active ? 'Cerita berhasil diaktifkan.' : 'Cerita berhasil dinonaktifkan.')
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Status cerita belum berhasil diubah.'
    notifyError(error.value)
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
    await $fetch(`/api/drafts/${id}`, { method: 'DELETE' })
    success('Draft berhasil dihapus.')
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Draft belum berhasil dihapus.'
    notifyError(error.value)
  } finally {
    pendingAction.value = ''
  }
}

async function copyLink(slug: string) {
  if (pendingAction.value) return
  pendingAction.value = `copy-story:${slug}`
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`)
    success('Link cerita berhasil disalin.')
  } catch {
    error.value = 'Tautan belum bisa disalin.'
    notifyError(error.value)
  } finally {
    pendingAction.value = ''
  }
}

async function signOut() {
  signingOut.value = true
  try {
    const result = await authClient.signOut()
    if (result.error) throw new Error(result.error.message || 'Belum berhasil keluar dari akun.')
    if (user.value) {
      localStorage.removeItem(`selamanya:${user.value.id}:draft-ref`)
      localStorage.removeItem(`selamanya:${user.value.id}:draft-content`)
    }
    success('Kamu sudah keluar dari akun.')
    await navigateTo('/login')
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Belum berhasil keluar dari akun.'
    notifyError(error.value)
  } finally {
    signingOut.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

onMounted(() => {
  hasLegacyDraft.value = Boolean(localStorage.getItem('selamanya:draft-content'))
  void load()
})
</script>

<style scoped>
.section-kicker { color: #5045f5; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; }
.account-stat, .account-card, .account-draft { border: 1px solid #e7ddd4; border-radius: 1.5rem; background: #fffdfa; box-shadow: 0 12px 40px rgb(35 25 20 / 4%); }
.account-stat { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; color: #756a62; font-size: 0.8rem; }
.account-stat strong { color: #201d28; font-family: 'Instrument Serif', serif; font-size: 2rem; }
.account-card { padding: 1rem; }
.account-draft { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; }
.loading-panel { display: flex; min-height: 7rem; align-items: center; justify-content: center; gap: 0.7rem; border: 1px dashed #d6c9bf; border-radius: 1.25rem; color: #756a62; font-size: 0.82rem; }
</style>
