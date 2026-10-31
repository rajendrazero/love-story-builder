<template>
  <main class="brand-ui min-h-screen bg-[#f7f4ed] px-5 py-8 md:px-12">
    <header class="mx-auto mb-10 flex max-w-6xl items-center justify-between gap-4">
      <NuxtLink to="/" class="font-display text-2xl">selamanya<span class="text-[#9c6257]">.</span></NuxtLink>
      <div class="flex items-center gap-3">
        <NuxtLink to="/templates" class="rounded-full bg-[#201d28] px-5 py-3 text-xs text-white">Pilih template ↗</NuxtLink>
        <button type="button" class="rounded-full border border-[#cbbcb0] px-5 py-3 text-xs" :disabled="signingOut" @click="signOut">
          {{ signingOut ? 'Keluar…' : 'Keluar' }}
        </button>
      </div>
    </header>

    <section class="mx-auto max-w-6xl">
      <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Akun Selamanya</p>
      <div class="mt-3 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 class="font-display text-5xl md:text-6xl">Halaman kalian.</h1>
          <p class="mt-3 text-sm text-[#756a62]">{{ user?.name }} · {{ user?.email }}</p>
        </div>
        <button type="button" class="rounded-full border border-[#cbbcb0] px-5 py-3 text-sm" :disabled="loading" @click="load">
          {{ loading ? 'Memuat…' : 'Muat ulang ↻' }}
        </button>
      </div>

      <p v-if="error" class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">{{ error }}</p>
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
        <div v-if="stories.length" class="grid gap-4 md:grid-cols-2">
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
              <button type="button" class="rounded-full border border-[#cbbcb0] px-4 py-2 text-xs" @click="toggleStory(story)">
                {{ story.isActive ? 'Nonaktifkan' : 'Aktifkan' }}
              </button>
              <button type="button" class="rounded-full border border-red-200 px-4 py-2 text-xs text-red-700" @click="deleteStory(story.slug)">Hapus</button>
              <button type="button" class="rounded-full border border-[#cbbcb0] px-4 py-2 text-xs" @click="copyLink(story.slug)">Salin link</button>
            </div>
          </article>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Cerita terbitmu akan muncul di sini.</p>
      </section>

      <section>
        <header class="mb-4 flex items-end justify-between gap-4">
          <div><p class="section-kicker mb-1">Autosave</p><h2 class="font-display text-3xl">Draft yang tersimpan</h2></div>
        </header>
        <div v-if="drafts.length" class="space-y-3">
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
              <button type="button" class="text-xs text-red-700 underline underline-offset-4" @click="deleteDraft(draft.id)">Hapus</button>
            </div>
          </article>
        </div>
        <p v-else class="rounded-2xl border border-dashed border-[#d6c9bf] p-8 text-center text-sm text-[#756a62]">Draft otomatis tersimpan di sini.</p>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
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
const user = ref<{ id: string, name: string, email: string }>()
const stories = ref<AccountStory[]>([])
const drafts = ref<AccountDraft[]>([])
const error = ref('')
const loading = ref(false)
const signingOut = ref(false)
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
  } finally {
    loading.value = false
  }
}

async function deleteStory(slug: string) {
  if (!window.confirm('Hapus cerita terbit ini secara permanen?')) return
  try {
    await $fetch(`/api/account/stories/${slug}`, { method: 'DELETE' })
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Cerita belum berhasil dihapus.'
  }
}

async function toggleStory(story: AccountStory) {
  const active = !story.isActive
  const prompt = active
    ? 'Aktifkan cerita ini agar link publik dapat dibuka lagi?'
    : 'Nonaktifkan cerita ini? Link publik akan menampilkan halaman tidak ditemukan.'
  if (!window.confirm(prompt)) return
  try {
    await $fetch(`/api/account/stories/${story.slug}`, {
      method: 'PATCH',
      body: { active },
    })
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Status cerita belum berhasil diubah.'
  }
}

async function deleteDraft(id: string) {
  if (!window.confirm('Hapus draft ini secara permanen?')) return
  try {
    await $fetch(`/api/drafts/${id}`, { method: 'DELETE' })
    await load()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Draft belum berhasil dihapus.'
  }
}

async function copyLink(slug: string) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}/w/${slug}`)
  } catch {
    error.value = 'Tautan belum bisa disalin.'
  }
}

async function signOut() {
  signingOut.value = true
  try {
    await authClient.signOut()
    if (user.value) {
      localStorage.removeItem(`selamanya:${user.value.id}:draft-ref`)
      localStorage.removeItem(`selamanya:${user.value.id}:draft-content`)
    }
    await navigateTo('/login')
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Belum berhasil keluar dari akun.'
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
</style>
