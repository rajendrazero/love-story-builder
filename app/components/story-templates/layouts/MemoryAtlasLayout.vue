<template>
  <div class="memory-atlas-layout">
    <slot name="hero" />
    <div class="atlas-timeline">
      <slot name="greeting" />
      <slot name="detail" />
      <slot name="gallery" />
    </div>
    <slot name="book" />
    <slot name="finale" />
  </div>
</template>

<style scoped>
.memory-atlas-layout {
  position: relative;
}

.atlas-timeline {
  position: relative;
  isolation: isolate;
}

.atlas-timeline::before {
  position: absolute;
  top: 4rem;
  bottom: 4rem;
  left: 0.6rem;
  z-index: 0;
  width: 1px;
  background: rgb(38 57 70 / 24%);
  content: '';
}

@media (max-width: 700px) {
  .atlas-timeline::before {
    left: 0.45rem;
  }
}
</style>
