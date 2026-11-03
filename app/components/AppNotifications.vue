<template>
  <div class="notification-stack" aria-label="Notifikasi">
    <TransitionGroup name="notification">
      <article
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-card"
        :class="`notification-${notification.tone}`"
        :role="notification.tone === 'error' ? 'alert' : 'status'"
      >
        <span class="notification-mark" aria-hidden="true">
          <AppIcon
            :name="notification.tone === 'success' ? 'check' : notification.tone === 'error' ? 'alert' : 'info'"
            :size="16"
          />
        </span>
        <div class="notification-content">
          <p class="notification-title">{{ notification.title }}</p>
          <p v-if="notification.location" class="notification-location">{{ notification.location }}</p>
          <p class="notification-message">{{ notification.message }}</p>
        </div>
        <button type="button" aria-label="Tutup notifikasi" @click="dismiss(notification.id)">
          <AppIcon name="close" :size="17" />
        </button>
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
  z-index: var(--z-notifications);
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
  color: var(--color-foreground);
  background: var(--color-surface);
  box-shadow: var(--shadow-large);
  pointer-events: auto;
}

.notification-mark {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  color: var(--color-foreground);
  background: var(--color-accent);
  font-weight: 700;
}

.notification-card p {
  margin: 0;
}

.notification-content {
  min-width: 0;
  flex: 1;
}

.notification-title {
  font-size: 0.85rem;
  font-weight: 750;
}

.notification-location {
  margin-top: 0.15rem !important;
  color: var(--color-muted-foreground);
  font-size: 0.7rem;
  font-weight: 650;
}

.notification-message {
  margin-top: 0.2rem !important;
  font-size: 0.82rem;
  line-height: 1.5;
}

.notification-card > button {
  display: grid;
  min-width: 1.5rem;
  min-height: 1.5rem;
  place-items: center;
  border: 0;
  padding: 0;
  color: var(--color-muted-foreground);
  background: transparent;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}

.notification-error .notification-mark { color: white; background: var(--color-destructive); }
.notification-info .notification-mark { color: white; background: var(--color-info); }

.notification-enter-active,
.notification-leave-active,
.notification-move {
  transition:
    opacity var(--motion-duration-normal) var(--motion-ease-standard),
    transform var(--motion-duration-normal) var(--motion-ease-standard);
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
