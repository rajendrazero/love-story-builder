<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div
        v-if="options"
        ref="backdrop"
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
const backdrop = ref<HTMLDivElement | null>(null)
const cancelButton = ref<HTMLButtonElement | null>(null)
const confirmButton = ref<HTMLButtonElement | null>(null)
let resolveConfirmation: ((confirmed: boolean) => void) | undefined
let previousBodyOverflow = ''
let previousFocus: HTMLElement | null = null
const previousInertStates = new Map<HTMLElement, boolean>()

function open(nextOptions: AppConfirmationOptions): Promise<boolean> {
  const focusTarget = resolveConfirmation
    ? previousFocus
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  if (resolveConfirmation) settle(false, false)
  previousFocus = focusTarget
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
    void nextTick(() => {
      makeBackgroundInert()
      cancelButton.value?.focus()
    })
  })
}

function makeBackgroundInert() {
  const dialogBackdrop = backdrop.value
  if (!dialogBackdrop || previousInertStates.size) return

  for (const child of document.body.children) {
    if (!(child instanceof HTMLElement) || child === dialogBackdrop) continue
    previousInertStates.set(child, child.inert)
    child.inert = true
  }
}

function restoreBackground() {
  for (const [element, wasInert] of previousInertStates) {
    element.inert = wasInert
  }
  previousInertStates.clear()
}

function settle(confirmed: boolean, restoreFocus = true) {
  const resolve = resolveConfirmation
  const focusTarget = previousFocus
  resolveConfirmation = undefined
  previousFocus = null
  options.value = null
  document.body.style.overflow = previousBodyOverflow
  restoreBackground()
  resolve?.(confirmed)
  if (restoreFocus && focusTarget) {
    void nextTick(() => {
      if (focusTarget.isConnected) focusTarget.focus()
    })
  }
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
  settle(false, false)
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
  color: var(--color-foreground);
  background: var(--color-surface);
  box-shadow: var(--shadow-overlay);
}

.confirm-mark {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 50%;
  color: var(--color-foreground);
  background: var(--color-accent);
  font-size: 1.2rem;
  font-weight: 700;
}

.confirm-mark-danger {
  color: var(--color-destructive);
  background: var(--color-destructive-surface);
}

h2 {
  margin: 1.2rem 0 0.5rem;
  font-family: var(--font-family-editorial);
  font-size: 1.45rem;
  line-height: 1.25;
}

.confirm-dialog > p {
  margin: 0;
  color: var(--color-muted-foreground);
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
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-4);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.confirm-actions button:hover {
  transform: translateY(-1px);
}

.confirm-cancel {
  border-color: var(--color-border) !important;
  color: var(--color-foreground);
  background: var(--color-surface);
}

.confirm-cancel:hover {
  background: var(--color-surface-muted);
}

.confirm-accept {
  color: var(--color-primary-foreground);
  background: var(--color-primary);
}

.confirm-accept:hover {
  background: var(--color-primary-hover);
}

.confirm-accept-danger {
  background: var(--color-destructive);
}

.confirm-accept-danger:hover {
  background: var(--color-destructive-hover);
}

.confirm-enter-active,
.confirm-leave-active {
  transition:
    opacity var(--motion-duration-normal) var(--motion-ease-standard),
    transform var(--motion-duration-normal) var(--motion-ease-standard);
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

  .confirm-actions button:hover {
    transform: none;
  }
}
</style>
