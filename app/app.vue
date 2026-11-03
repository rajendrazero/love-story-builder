<template>
  <div class="min-h-screen" :class="{ 'cinematic-cursor': cursorPreset !== 'system' }">
    <a class="skip-link" :href="isPublicStoryRoute ? '#entrance-open' : '#main-content'">Lewati ke konten utama</a>
    <SiteNavigation v-if="!isPublicStoryRoute" />
    <div v-if="routeLoading && !isPublicStoryRoute" class="route-loading-track" role="progressbar" aria-label="Memuat halaman">
      <span />
    </div>
    <NuxtPage />
    <AppConfirmDialog ref="confirmDialog" />
    <footer v-if="!isPublicStoryRoute" class="site-footer">
      <NuxtLink to="/" class="site-footer-brand">selamanya<span>.</span></NuxtLink>
      <nav aria-label="Informasi hukum">
        <NuxtLink to="/privacy-policy">Kebijakan Privasi</NuxtLink>
        <NuxtLink to="/terms">Syarat dan Ketentuan</NuxtLink>
      </nav>
    </footer>
    <AppNotifications />
    <div
      v-show="!isPublicStoryRoute && cursorPreset !== 'system'"
      ref="cursor"
      class="app-cursor pointer-events-none fixed left-0 top-0 hidden h-7 w-7 items-center justify-center rounded-full border border-white/70 mix-blend-difference md:flex"
      :class="`app-cursor-${cursorPreset}`"
      aria-hidden="true"
    >{{ cursorSymbol }}</div>
    <div
      v-if="scrollbarVisible && !isPublicStoryRoute"
      ref="scrollbarTrack"
      class="custom-scrollbar-track"
      @pointerdown="onScrollbarPointerDown"
    >
      <button
        ref="scrollbarThumb"
        type="button"
        class="custom-scrollbar-thumb"
        role="scrollbar"
        aria-label="Posisi halaman"
        aria-orientation="vertical"
        :aria-valuemin="0"
        :aria-valuemax="Math.round(maxScroll)"
        :aria-valuenow="Math.round(scrollPosition)"
        :style="scrollbarThumbStyle"
        @pointerdown.stop="onScrollbarPointerDown"
        @keydown="onScrollbarKeydown"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gsap } from 'gsap'
import { appConfirmationKey, type AppConfirmationOptions } from './composables/useAppConfirmation'

const cursor = ref<HTMLElement | null>(null)
const confirmDialog = ref<{ open: (options: AppConfirmationOptions) => Promise<boolean> } | null>(null)
const routeLoading = ref(false)
const router = useRouter()
const route = useRoute()
const isPublicStoryRoute = computed(() => route.path.startsWith('/w/'))
provide(appConfirmationKey, (options: AppConfirmationOptions) => {
  if (!confirmDialog.value) return Promise.resolve(false)
  return confirmDialog.value.open(options)
})
const cursorPreset = useState<'ring' | 'heart' | 'sparkle' | 'flower' | 'star' | 'system'>('story-cursor', () => 'system')
const cursorSymbol = computed(() => ({
  ring: '',
  heart: '♥',
  sparkle: '✦',
  flower: '✿',
  star: '★',
  system: '',
})[cursorPreset.value])
const scrollbarTrack = ref<HTMLElement | null>(null)
const scrollbarThumb = ref<HTMLButtonElement | null>(null)
const scrollbarVisible = ref(false)
const scrollbarThumbHeight = ref(0)
const scrollbarThumbTop = ref(0)
const maxScroll = ref(0)
const scrollPosition = ref(0)
const scrollbarThumbStyle = computed(() => ({
  height: `${scrollbarThumbHeight.value}px`,
  top: `${scrollbarThumbTop.value}px`,
}))
let moveCursorX: ((value: number) => void) | undefined
let moveCursorY: ((value: number) => void) | undefined
let resizeObserver: ResizeObserver | undefined
let removeRouterGuards: Array<() => void> = []
let metricsFrame = 0
let scrollFrame = 0
let viewportHeight = 0
let trackHeight = 0
let dragOffset = 0
let draggingScrollbar = false

function handlePointerMove(event: PointerEvent) {
  moveCursorX?.(event.clientX - 14)
  moveCursorY?.(event.clientY - 14)
}

function updateScrollbarPosition() {
  if (isPublicStoryRoute.value) return
  scrollPosition.value = Math.min(maxScroll.value, Math.max(0, window.scrollY))
  scrollbarThumbTop.value = maxScroll.value > 0
    ? scrollPosition.value / maxScroll.value * (trackHeight - scrollbarThumbHeight.value)
    : 0
}

function updateScrollbarMetrics() {
  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )
  viewportHeight = window.innerHeight
  maxScroll.value = Math.max(0, documentHeight - viewportHeight)
  scrollbarVisible.value = maxScroll.value > 1

  trackHeight = scrollbarTrack.value?.clientHeight ?? viewportHeight
  scrollbarThumbHeight.value = Math.min(
    trackHeight,
    Math.max(42, trackHeight * viewportHeight / documentHeight),
  )
  updateScrollbarPosition()
}

function scheduleScrollbarUpdate() {
  if (scrollFrame) return
  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = 0
    updateScrollbarPosition()
  })
}

function scheduleScrollbarMetrics() {
  if (metricsFrame) return
  metricsFrame = window.requestAnimationFrame(() => {
    metricsFrame = 0
    updateScrollbarMetrics()
  })
}

function scrollToThumbPosition(clientY: number, offset: number) {
  const track = scrollbarTrack.value
  if (!track || maxScroll.value <= 0) return

  const availableTrack = trackHeight - scrollbarThumbHeight.value
  if (availableTrack <= 0) return

  const top = Math.min(
    availableTrack,
    Math.max(0, clientY - track.getBoundingClientRect().top - offset),
  )
  window.scrollTo({ top: top / availableTrack * maxScroll.value, behavior: 'auto' })
}

function onScrollbarPointerDown(event: PointerEvent) {
  const thumb = scrollbarThumb.value
  const track = scrollbarTrack.value
  if (!thumb || !track) return

  if (event.target === thumb) {
    draggingScrollbar = true
    dragOffset = event.clientY - thumb.getBoundingClientRect().top
    thumb.setPointerCapture(event.pointerId)
    event.preventDefault()
    return
  }

  scrollToThumbPosition(event.clientY, scrollbarThumbHeight.value / 2)
}

function onScrollbarPointerMove(event: PointerEvent) {
  if (draggingScrollbar) scrollToThumbPosition(event.clientY, dragOffset)
}

function onScrollbarPointerUp() {
  draggingScrollbar = false
}

function onScrollbarKeydown(event: KeyboardEvent) {
  const scrollStep = Math.max(40, window.innerHeight * 0.1)
  let nextPosition: number | undefined

  switch (event.key) {
    case 'ArrowDown':
      nextPosition = scrollPosition.value + scrollStep
      break
    case 'ArrowUp':
      nextPosition = scrollPosition.value - scrollStep
      break
    case 'PageDown':
      nextPosition = scrollPosition.value + window.innerHeight * 0.8
      break
    case 'PageUp':
      nextPosition = scrollPosition.value - window.innerHeight * 0.8
      break
    case 'Home':
      nextPosition = 0
      break
    case 'End':
      nextPosition = maxScroll.value
      break
  }

  if (nextPosition === undefined) return
  event.preventDefault()
  window.scrollTo({ top: nextPosition, behavior: 'auto' })
}

onMounted(() => {
  removeRouterGuards = [
    router.beforeEach((to, from) => {
      if (to.fullPath !== from.fullPath) routeLoading.value = true
    }),
    router.afterEach(() => {
      routeLoading.value = false
      nextTick(scheduleScrollbarMetrics)
    }),
    router.onError(() => {
      routeLoading.value = false
    }),
  ]
  updateScrollbarMetrics()
  nextTick(scheduleScrollbarMetrics)
  window.addEventListener('scroll', scheduleScrollbarUpdate, { passive: true })
  window.addEventListener('resize', scheduleScrollbarMetrics, { passive: true })
  window.addEventListener('pointermove', onScrollbarPointerMove, { passive: true })
  window.addEventListener('pointerup', onScrollbarPointerUp, { passive: true })
  resizeObserver = new ResizeObserver(scheduleScrollbarMetrics)
  resizeObserver.observe(document.documentElement)
  resizeObserver.observe(document.body)

  const supportsCustomCursor = window.matchMedia(
    '(pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference)',
  ).matches
  if (!supportsCustomCursor || !cursor.value) return
  moveCursorX = gsap.quickTo(cursor.value, 'x', { duration: 0.22, ease: 'power2.out' })
  moveCursorY = gsap.quickTo(cursor.value, 'y', { duration: 0.22, ease: 'power2.out' })
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
})

onBeforeUnmount(() => {
  routeLoading.value = false
  for (const removeGuard of removeRouterGuards) removeGuard()
  removeRouterGuards = []
  window.removeEventListener('pointermove', handlePointerMove)
  window.removeEventListener('scroll', scheduleScrollbarUpdate)
  window.removeEventListener('resize', scheduleScrollbarMetrics)
  window.removeEventListener('pointermove', onScrollbarPointerMove)
  window.removeEventListener('pointerup', onScrollbarPointerUp)
  resizeObserver?.disconnect()
  if (metricsFrame) window.cancelAnimationFrame(metricsFrame)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
  if (cursor.value) gsap.killTweensOf(cursor.value)
  moveCursorX = undefined
  moveCursorY = undefined
})
</script>
