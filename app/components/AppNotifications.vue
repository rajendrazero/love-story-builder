<template>
  <div class="notification-stack" aria-label="Notifikasi" aria-live="polite">
    <TransitionGroup name="notification">
      <article
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        :class="`notification-${notification.tone}`"
        :role="notification.tone === 'error' ? 'alert' : 'status'"
      >
        <span class="notification-mark" aria-hidden="true">
          {{ notification.tone === 'success' ? '✓' : notification.tone === 'error' ? '!' : '✳' }}
        </span>
        <p>{{ notification.message }}</p>
        <button type="button" aria-label="Tutup notifikasi" @click="dismiss(notification.id)">×</button>
      </article>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
const { notifications, dismiss } = useNotifications()
const timers = new Map<string, ReturnType<typeof setTimeout>>()

watch(notifications, (items) => {
  const activeIds = new Set(items.map(item => item.id))
  for (const [id, timer] of timers) {
    if (!activeIds.has(id)) {
      clearTimeout(timer)
      timers.delete(id)
    }
  }
  for (const item of items) {
    if (timers.has(item.id)) continue
    timers.set(item.id, setTimeout(() => dismiss(item.id), item.tone === 'error' ? 7000 : 4500))
  }
}, { immediate: true })

onBeforeUnmount(() => {
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
})
</script>

<style scoped>
.notification-stack {
  position: fixed;
  top: 5.25rem;
  right: clamp(0.75rem, 3vw, 2rem);
  z-index: 120;
  display: grid;
  width: min(24rem, calc(100vw - 1.5rem));
  gap: 0.65rem;
  pointer-events: none;
}

.notification-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid rgb(32 29 40 / 10%);
  border-radius: 1rem;
  padding: 0.85rem 0.9rem;
  color: #201d28;
  background: #fffdfa;
  box-shadow: 0 12px 35px rgb(32 29 40 / 14%);
  pointer-events: auto;
}

.notification-mark {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: #201d28;
  background: #d8f36a;
  font-weight: 700;
}

.notification-card p {
  flex: 1;
  margin: 0.1rem 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
}

.notification-card > button {
  border: 0;
  padding: 0;
  color: #77727d;
  background: transparent;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.notification-error .notification-mark { color: white; background: #b94a42; }
.notification-info .notification-mark { color: white; background: #5045f5; }

.notification-enter-active,
.notification-leave-active,
.notification-move {
  transition: opacity 180ms ease, transform 180ms ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .notification-enter-active,
  .notification-leave-active,
  .notification-move { transition: none; }
}
</style>
