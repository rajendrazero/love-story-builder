<template>
  <span class="audio-visualizer" :class="{ 'audio-visualizer-playing': playing }" aria-hidden="true">
    <span />
    <span />
    <span />
    <span />
  </span>
</template>

<script setup lang="ts">
defineProps<{
  playing: boolean
}>()
</script>

<style scoped>
.audio-visualizer {
  display: inline-flex;
  height: 1.15rem;
  align-items: center;
  gap: 0.13rem;
}

.audio-visualizer span {
  width: 0.12rem;
  height: 0.35rem;
  border-radius: 999px;
  background: currentColor;
  transform: scaleY(0.55);
}

.audio-visualizer-playing span {
  animation: audio-wave 650ms ease-in-out infinite alternate;
}

.audio-visualizer-playing span:nth-child(2) { animation-delay: 160ms; }
.audio-visualizer-playing span:nth-child(3) { animation-delay: 320ms; }
.audio-visualizer-playing span:nth-child(4) { animation-delay: 90ms; }

@keyframes audio-wave {
  from { transform: scaleY(0.45); }
  to { transform: scaleY(1.7); }
}

@media (prefers-reduced-motion: reduce) {
  .audio-visualizer-playing span {
    animation: none;
    transform: scaleY(1);
  }
}
</style>
