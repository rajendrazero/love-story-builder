<template>
  <div class="story-layout story-layout-botanical">
    <div class="journal-opening">
      <slot name="hero" />
      <slot name="greeting" />
    </div>
    <div class="journal-observations">
      <slot name="detail" />
      <slot name="gallery" />
    </div>
    <slot name="book" />
    <slot name="finale" />
  </div>
</template>

<style scoped>
.story-layout-botanical,
.journal-opening,
.journal-observations {
  display: contents;
}
</style>
