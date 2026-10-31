<template>
  <div class="story-layout story-layout-cinema">
    <div class="cinema-reel cinema-reel-opening">
      <slot name="hero" />
      <slot name="gallery" />
    </div>
    <div class="cinema-reel cinema-reel-story">
      <slot name="greeting" />
      <slot name="detail" />
    </div>
    <div class="cinema-reel cinema-reel-ending">
      <slot name="book" />
      <slot name="finale" />
    </div>
  </div>
</template>

<style scoped>
.story-layout-cinema,
.cinema-reel {
  display: contents;
}
</style>
