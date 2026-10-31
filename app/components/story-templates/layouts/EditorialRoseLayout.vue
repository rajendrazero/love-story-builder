<template>
  <div class="story-layout story-layout-editorial">
    <slot name="hero" />
    <slot name="greeting" />
    <slot name="gallery" />
    <slot name="detail" />
    <slot name="book" />
    <slot name="finale" />
  </div>
</template>

<style scoped>
.story-layout-editorial {
  display: contents;
}
</style>
