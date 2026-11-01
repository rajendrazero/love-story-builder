<script setup lang="ts">
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'
type ButtonType = 'button' | 'submit' | 'reset'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
})

const buttonClasses = computed(() => [
  'app-button',
  `app-button--${props.variant}`,
  `app-button--${props.size}`,
])
</script>

<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span v-if="loading" class="loading-spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.app-button {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  padding: 0 var(--space-5);
  color: var(--color-foreground);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-body-small);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-compact);
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    color var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.app-button--sm {
  min-height: 2.5rem;
  padding-inline: var(--space-4);
  font-size: var(--font-size-caption);
}

.app-button--md {
  min-height: 2.75rem;
}

.app-button--lg {
  min-height: 3.25rem;
  padding-inline: var(--space-6);
  font-size: var(--font-size-body);
}

.app-button--primary {
  color: var(--color-primary-foreground);
  background: var(--color-primary);
}

.app-button--primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.app-button--secondary {
  border-color: var(--color-border);
  background: var(--color-surface);
}

.app-button--secondary:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.app-button--ghost {
  background: transparent;
}

.app-button--ghost:hover:not(:disabled) {
  background: var(--color-surface-muted);
}

.app-button--danger {
  color: var(--color-destructive-foreground);
  background: var(--color-destructive);
}

.app-button--danger:hover:not(:disabled) {
  background: var(--color-destructive-hover);
}

.app-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.app-button:disabled:hover {
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .app-button {
    transition: none;
  }

  .app-button:hover:not(:disabled) {
    transform: none;
  }
}

@media (forced-colors: active) {
  .app-button {
    border-color: ButtonText;
  }

  .app-button:focus-visible {
    outline-color: Highlight;
  }
}
</style>
