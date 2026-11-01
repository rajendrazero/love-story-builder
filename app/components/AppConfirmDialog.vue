<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div
        v-if="options"
        class="confirm-backdrop"
        @click.self="settle(false)"
        @keydown="onKeydown"
      >
        <section
          class="confirm-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          tabindex="-1"
        >
          <div class="confirm-mark" :class="{ 'confirm-mark-danger': options.tone === 'danger' }" aria-hidden="true">
            {{ options.tone === 'danger' ? '!' : '✳' }}
          </div>
          <h2 id="confirm-title">{{ options.title }}</h2>
          <p id="confirm-message">{{ options.message }}</p>
          <div class="confirm-actions">
            <button ref="cancelButton" type="button" class="confirm-cancel" @click="settle(false)">
              {{ options.cancelLabel }}
            </button>
            <button
              ref="confirmButton"
              type="button"
              class="confirm-accept"
              :class="{ 'confirm-accept-danger': options.tone === 'danger' }"
              @click="settle(true)"
            >
              {{ options.confirmLabel }}
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { AppConfirmationOptions } from '../composables/useAppConfirmation'

const options = ref<AppConfirmationOptions | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const confirmButton = ref<HTMLButtonElement | null>(null)
let resolveConfirmation: ((confirmed: boolean) => void) | undefined
let previousBodyOverflow = ''

function open(nextOptions: AppConfirmationOptions): Promise<boolean> {
  if (resolveConfirmation) settle(false)
  options.value = {
    confirmLabel: 'Lanjutkan',
    cancelLabel: 'Batal',
    tone: 'default',
    ...nextOptions,
  }
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  return new Promise((resolve) => {
    resolveConfirmation = resolve
    nextTick(() => cancelButton.value?.focus())
  })
}

function settle(confirmed: boolean) {
  const resolve = resolveConfirmation
  resolveConfirmation = undefined
  options.value = null
  document.body.style.overflow = previousBodyOverflow
  resolve?.(confirmed)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    settle(false)
    return
  }
  if (event.key !== 'Tab') return

  const first = cancelButton.value
  const last = confirmButton.value
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

defineExpose({ open })

onBeforeUnmount(() => {
  settle(false)
})
</script>

<style scoped>
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 150;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(24 22 29 / 56%);
  backdrop-filter: blur(5px);
}

.confirm-dialog {
  width: min(100%, 28rem);
  border: 1px solid rgb(32 29 40 / 10%);
  border-radius: 1.5rem;
  padding: clamp(1.25rem, 5vw, 2rem);
  color: #201d28;
  background: #fffdfa;
  box-shadow: 0 24px 80px rgb(20 18 25 / 28%);
  outline: none;
}

.confirm-mark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 50%;
  color: #201d28;
  background: #d8f36a;
  font-size: 1.2rem;
  font-weight: 700;
}

.confirm-mark-danger {
  color: #9c302a;
  background: #ffe4df;
}

h2 {
  margin: 1.2rem 0 0.5rem;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.45rem;
  line-height: 1.25;
}

.confirm-dialog > p {
  margin: 0;
  color: #66616d;
  font-size: 0.92rem;
  line-height: 1.65;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1.75rem;
}

.confirm-actions button {
  min-height: 2.75rem;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 0.7rem 1.1rem;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 160ms ease, transform 160ms ease;
}

.confirm-actions button:hover {
  transform: translateY(-1px);
}

.confirm-actions button:focus-visible {
  outline: 3px solid rgb(80 69 245 / 35%);
  outline-offset: 3px;
}

.confirm-cancel {
  border-color: #e3dfd8 !important;
  color: #514d57;
  background: transparent;
}

.confirm-cancel:hover {
  background: #f4f1eb;
}

.confirm-accept {
  color: #fff;
  background: #5045f5;
}

.confirm-accept:hover {
  background: #3e35d6;
}

.confirm-accept-danger {
  background: #b94139;
}

.confirm-accept-danger:hover {
  background: #9f332d;
}

.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-dialog,
.confirm-leave-to .confirm-dialog {
  transform: translateY(0.5rem) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .confirm-enter-active,
  .confirm-leave-active,
  .confirm-actions button {
    transition: none;
  }
}
</style>
