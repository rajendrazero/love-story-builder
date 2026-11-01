<template>
  <div class="min-h-screen" :class="{ 'cinematic-cursor': cursorPreset !== 'system' }">
    <SiteNavigation />
    <div v-if="routeLoading" class="route-loading-track" role="progressbar" aria-label="Memuat halaman">
      <span />
    </div>
    <NuxtPage />
    <AppConfirmDialog ref="confirmDialog" />
    <footer class="site-footer">
      <NuxtLink to="/" class="site-footer-brand">selamanya<span>.</span></NuxtLink>
      <nav aria-label="Informasi hukum">
        <NuxtLink to="/privacy-policy">Kebijakan Privasi</NuxtLink>
        <NuxtLink to="/terms">Syarat dan Ketentuan</NuxtLink>
      </nav>
    </footer>
    <AppNotifications />
    <div
      v-show="cursorPreset !== 'system'"
      ref="cursor"
      class="app-cursor pointer-events-none fixed left-0 top-0 z-[100] hidden h-7 w-7 items-center justify-center rounded-full border border-white/70 mix-blend-difference md:flex"
      :class="`app-cursor-${cursorPreset}`"
      aria-hidden="true"
    >{{ cursorSymbol }}</div>
    <div
      v-if="scrollbarVisible"
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
let dragOffset = 0
let draggingScrollbar = false

function handlePointerMove(event: PointerEvent) {
  moveCursorX?.(event.clientX - 14)
  moveCursorY?.(event.clientY - 14)
}

function updateScrollbar() {
  const documentHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
  )
  const viewportHeight = window.innerHeight
  maxScroll.value = Math.max(0, documentHeight - viewportHeight)
  scrollPosition.value = Math.min(maxScroll.value, Math.max(0, window.scrollY))
  scrollbarVisible.value = maxScroll.value > 1

  const trackHeight = scrollbarTrack.value?.clientHeight ?? viewportHeight
  scrollbarThumbHeight.value = Math.min(
    trackHeight,
    Math.max(42, trackHeight * viewportHeight / documentHeight),
  )
  scrollbarThumbTop.value = maxScroll.value > 0
    ? scrollPosition.value / maxScroll.value * (trackHeight - scrollbarThumbHeight.value)
    : 0
}

function scheduleScrollbarUpdate() {
  if (metricsFrame) return
  metricsFrame = window.requestAnimationFrame(() => {
    metricsFrame = 0
    updateScrollbar()
  })
}

function scrollToThumbPosition(clientY: number, offset: number) {
  const track = scrollbarTrack.value
  if (!track || maxScroll.value <= 0) return

  const availableTrack = track.clientHeight - scrollbarThumbHeight.value
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
    }),
    router.onError(() => {
      routeLoading.value = false
    }),
  ]
  updateScrollbar()
  nextTick(updateScrollbar)
  window.addEventListener('scroll', scheduleScrollbarUpdate, { passive: true })
  window.addEventListener('resize', scheduleScrollbarUpdate, { passive: true })
  window.addEventListener('pointermove', onScrollbarPointerMove, { passive: true })
  window.addEventListener('pointerup', onScrollbarPointerUp, { passive: true })
  resizeObserver = new ResizeObserver(scheduleScrollbarUpdate)
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
  window.removeEventListener('resize', scheduleScrollbarUpdate)
  window.removeEventListener('pointermove', onScrollbarPointerMove)
  window.removeEventListener('pointerup', onScrollbarPointerUp)
  resizeObserver?.disconnect()
  if (metricsFrame) window.cancelAnimationFrame(metricsFrame)
  if (cursor.value) gsap.killTweensOf(cursor.value)
  moveCursorX = undefined
  moveCursorY = undefined
})
</script>

<style>
.route-loading-track {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 130;
  height: 3px;
  overflow: hidden;
  background: rgb(80 69 245 / 12%);
}

.site-footer {
  display: flex;
  width: min(100% - 2rem, 90rem);
  min-height: 5rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 3rem auto 0;
  border-top: 1px solid rgb(32 29 40 / 12%);
  color: #514d57;
  font-size: 0.8rem;
}

.site-footer a {
  color: inherit;
  text-decoration: none;
}

.site-footer a:hover,
.site-footer a:focus-visible {
  color: #5045f5;
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.site-footer-brand {
  color: #201d28 !important;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1rem;
  font-weight: 700;
}

.site-footer-brand span {
  color: #5045f5;
}

.site-footer nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem 1.25rem;
}

.site-footer a:focus-visible {
  border-radius: 0.2rem;
  outline: 2px solid #5045f5;
  outline-offset: 3px;
}

@media (max-width: 480px) {
  .site-footer {
    align-items: flex-start;
    flex-direction: column;
    justify-content: center;
    padding-block: 1rem;
  }

  .site-footer nav {
    justify-content: flex-start;
  }
}

.route-loading-track span {
  display: block;
  width: 40%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #5045f5, #d8f36a);
  animation: route-loading 1s ease-in-out infinite;
}

@keyframes route-loading {
  from { transform: translateX(-110%); }
  to { transform: translateX(260%); }
}

.custom-scrollbar-track {
  position: fixed;
  inset: 0 0.25rem 0 0;
  z-index: 110;
  width: 0.75rem;
  touch-action: none;
}

.app-cursor-heart,
.app-cursor-sparkle,
.app-cursor-flower,
.app-cursor-star {
  border: 0;
  color: #fffaf5;
  font-size: 1.15rem;
  line-height: 1;
  text-shadow: 0 1px 5px rgb(32 29 40 / 45%);
}

.custom-scrollbar-thumb {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0.55rem;
  min-height: 2.6rem;
  border: 1px solid rgb(255 250 245 / 65%);
  border-radius: 999px;
  padding: 0;
  background: linear-gradient(180deg, #d8f36a, #5045f5);
  box-shadow: 0 2px 12px rgb(32 29 40 / 22%);
  cursor: grab;
  transform: translateX(-50%);
  touch-action: none;
  transition: background 160ms ease, box-shadow 160ms ease;
}

.custom-scrollbar-thumb:hover,
.custom-scrollbar-thumb:focus-visible {
  background: linear-gradient(180deg, #ff7968, #5045f5);
  box-shadow: 0 2px 14px rgb(32 29 40 / 35%);
}

.custom-scrollbar-thumb:active {
  cursor: grabbing;
}

.custom-scrollbar-thumb:focus-visible {
  outline: 2px solid #fffaf5;
  outline-offset: 2px;
}

@media (pointer: fine) and (min-width: 768px) and (prefers-reduced-motion: no-preference) {
  .cinematic-cursor,
  .cinematic-cursor * {
    cursor: none !important;
  }
}
</style>
