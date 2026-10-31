<template>
  <div class="story-layout story-layout-love-letter">
    <div class="letter-opening">
      <slot name="hero" />
      <slot name="greeting" />
    </div>
    <slot name="book" />
    <div class="letter-memories">
      <slot name="gallery" />
      <slot name="detail" />
    </div>
    <slot name="finale" />
  </div>
</template>

<style scoped>
.story-layout-love-letter,
.letter-opening,
.letter-memories {
  display: contents;
}
</style>
