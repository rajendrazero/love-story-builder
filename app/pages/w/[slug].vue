<template>
  <main v-if="locked" class="grid min-h-screen place-items-center bg-[#211b18] px-5 text-paper">
    <form class="w-full max-w-md text-center" @submit.prevent="unlock">
      <p class="text-xs uppercase tracking-[0.3em] text-rose">Sebuah cerita pribadi</p>
      <h1 class="mt-4 font-display text-5xl">{{ title }}</h1>
      <p class="mt-3 text-sm text-white/60">Masukkan sandi untuk membuka halaman ini.</p>
      <input id="story-password" v-model="password" name="password" class="editor-input mt-7 text-center" type="password" required placeholder="Sandi cerita">
      <button class="mt-4 w-full rounded-full bg-paper px-6 py-4 text-sm text-ink">Buka cerita</button>
      <p v-if="error" class="mt-4 text-sm text-rose">{{ error }}</p>
    </form>
  </main>
  <StoryExperience v-else-if="story" :story="story" />
</template>

<script setup lang="ts">
import type { StoryContent } from '#shared/schema/story'

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
const error = ref('')

async function unlock() {
  error.value = ''
  try {
    const result = await $fetch<{ story: StoryContent }>(`/api/stories/${slug}/unlock`, {
      method: 'POST',
      body: { password: password.value },
    })
    story.value = result.story
    locked.value = false
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Cerita belum bisa dibuka.'
  }
}
</script>
