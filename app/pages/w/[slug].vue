<template>
  <main v-if="locked" id="main-content" tabindex="-1" class="grid min-h-screen place-items-center bg-[#211b18] px-5 text-paper">
    <form class="w-full max-w-md text-center" @submit.prevent="unlock">
      <p class="text-xs uppercase tracking-[0.3em] text-rose">Sebuah cerita pribadi</p>
      <h1 class="mt-4 font-display text-5xl">{{ title }}</h1>
      <p class="mt-3 text-sm text-white/60">Masukkan sandi untuk membuka halaman ini.</p>
      <span class="public-story-password floating-field floating-field--dark mt-7">
        <label for="story-password" class="editor-label">Sandi cerita</label>
        <input
          id="story-password"
          v-model="password"
          name="password"
          class="editor-input text-center"
          :type="passwordVisible ? 'text' : 'password'"
          required
          autocomplete="current-password"
          placeholder="••••••••"
        >
        <button
          type="button"
          class="public-story-password-toggle"
          :aria-label="passwordVisible ? 'Sembunyikan sandi cerita' : 'Tampilkan sandi cerita'"
          :aria-pressed="passwordVisible"
          @click="passwordVisible = !passwordVisible"
        ><AppIcon :name="passwordVisible ? 'eye-off' : 'eye'" :size="19" /></button>
      </span>
      <button class="mt-4 w-full rounded-full bg-paper px-6 py-4 text-sm text-ink">Buka cerita</button>
      <AppErrorAlert v-if="error" class="mt-4 text-left" :title="error.title" :message="error.message" :location="error.location" />
    </form>
  </main>
  <StoryExperience v-else-if="story" :story="story" />
</template>

<script setup lang="ts">
import type { StoryContent } from '#shared/schema/story'
import { getUserFacingError, type UserFacingError } from '#shared/utils/user-facing-error'

const route = useRoute()
const slug = String(route.params.slug)
const { data, error: loadError } = await useFetch<{ title: string, locked: boolean, story?: StoryContent }>(`/api/stories/${slug}`)
if (loadError.value) {
  throw createError({ statusCode: loadError.value.statusCode || 404, statusMessage: 'Cerita tidak ditemukan.' })
}

const title = computed(() => data.value?.title ?? 'Cerita kita')
const locked = ref(data.value?.locked ?? true)
const story = ref<StoryContent | null>(data.value?.story ?? null)
const password = ref('')
const passwordVisible = ref(false)
const error = ref<UserFacingError | null>(null)
const metadataTitle = computed(() => story.value
  ? `${story.value.coupleNames} — ${story.value.title}`
  : `${title.value} — Selamanya`)
const metadataDescription = computed(() => locked.value
  ? 'Cerita ini dilindungi sandi.'
  : `Cerita ${story.value?.coupleNames ?? ''} dibagikan melalui Selamanya.`)

useSeoMeta({
  title: metadataTitle,
  description: metadataDescription,
  ogTitle: metadataTitle,
  ogDescription: metadataDescription,
  ogType: 'article',
  robots: () => data.value?.locked ? 'noindex, nofollow' : 'index, follow',
})

async function unlock() {
  error.value = null
  try {
    const result = await $fetch<{ story: StoryContent }>(`/api/stories/${slug}/unlock`, {
      method: 'POST',
      body: { password: password.value },
    })
    story.value = result.story
    locked.value = false
  } catch (caught) {
    error.value = getUserFacingError(caught, {
      title: 'Cerita belum bisa dibuka',
      fallback: 'Periksa sandi dan coba lagi.',
      location: 'Halaman cerita · Verifikasi sandi',
    })
  }
}
</script>

<style scoped>
.public-story-password {
  position: relative;
  display: block;
}

.public-story-password .editor-input {
  padding-right: 3.5rem;
  border-color: rgb(255 250 245 / 40%);
  color: #fffaf5;
  background: #211b18;
}

.floating-field--dark {
  --floating-label-background: #211b18;
}

.floating-field--dark > .editor-label {
  color: rgb(255 250 245 / 70%);
}

.floating-field--dark:focus-within > .editor-label,
.floating-field--dark:has(.editor-input:not(:placeholder-shown)) > .editor-label {
  color: #ffd6b8;
}

.floating-field--dark:focus-within .editor-input {
  border-color: #ffd6b8;
}

.public-story-password-toggle {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: #201d28;
  background: transparent;
  transform: translateY(-50%);
  cursor: pointer;
}

.public-story-password-toggle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
</style>
