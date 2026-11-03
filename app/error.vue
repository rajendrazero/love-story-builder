<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const pageTitle = computed(() => statusCode.value === 404
  ? 'Halaman tidak ditemukan.'
  : 'Halaman belum dapat dibuka.')
const pageMessage = computed(() => statusCode.value === 404
  ? 'Tautan ini mungkin sudah berubah atau tidak tersedia.'
  : 'Terjadi kendala saat membuka halaman ini. Coba kembali beberapa saat lagi.')

useSeoMeta({
  title: () => `${statusCode.value} — ${pageTitle.value}`,
  robots: 'noindex, nofollow',
})
</script>

<template>
  <main id="main-content" tabindex="-1" class="grid min-h-screen place-items-center bg-paper px-5 py-12">
    <section class="w-full max-w-xl rounded-3xl border border-[#e7ddd4] bg-white/80 p-8 text-center shadow-lg sm:p-12">
      <p class="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Selamanya</p>
      <p class="mt-6 font-display text-6xl text-primary">{{ statusCode }}</p>
      <h1 class="mt-3 font-display text-4xl text-ink">{{ pageTitle }}</h1>
      <p class="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">{{ pageMessage }}</p>
      <a href="/" class="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        Kembali ke beranda
      </a>
    </section>
  </main>
</template>
