<template>
  <div
    class="decorative-layer"
    :class="[`decorative-scene-${scene}`]"
    :data-template="templateId"
    aria-hidden="true"
  >
    <svg viewBox="0 0 1200 800" preserveAspectRatio="none">
      <g v-if="templateId === 'editorial-rose'">
        <path class="decorative-orbit" d="M56 438C205 78 914 22 1148 338" />
        <path class="decorative-orbit decorative-orbit-secondary" d="M89 524C356 723 915 704 1124 420" />
        <path class="decorative-curve" d="M0 245C185 185 233 315 370 268S593 105 736 181" />
        <path class="decorative-starburst" d="M190 128v46m-23-23h46m-39-16 32 32m0-32-32 32" />
        <path class="decorative-starburst decorative-starburst-small" d="M1015 603v32m-16-16h32m-27-11 22 22m0-22-22 22" />
        <path class="decorative-diamond" d="m930 170 9 12-9 12-9-12z" />
        <path class="decorative-diamond decorative-diamond-secondary" d="m278 620 6 8-6 8-6-8z" />
      </g>
      <g v-else-if="templateId === 'midnight-cinema'">
        <circle class="decorative-moon" cx="1018" cy="180" r="52" />
        <path class="decorative-cinema-orbit" d="M56 560C306 116 827 77 1150 400" />
        <path class="decorative-cinema-frame" d="M135 260h205v132H135zM160 285h155v82H160z" />
        <path class="decorative-cinema-stars" d="m535 184 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2zM851 585v34m-17-17h34" />
        <circle class="decorative-cinema-dot" cx="1090" cy="580" r="5" />
        <circle class="decorative-cinema-dot decorative-cinema-dot-small" cx="778" cy="150" r="3" />
      </g>
      <g v-else-if="templateId === 'botanical-journal'">
        <path class="decorative-stem" d="M1080 790C1004 608 1052 391 932 190M1008 612C886 603 814 543 778 444M1020 658C1106 592 1144 502 1144 421M967 468C852 421 812 339 806 270" />
        <path class="decorative-leaf" d="M778 444c-8-73 45-116 106-121-3 62-38 107-106 121zM1144 421c-66-25-83-86-58-145 56 26 81 72 58 145zM806 270c-62-23-79-78-58-132 53 24 76 66 58 132zM1008 612c-48-47-43-103 3-148 42 43 47 93-3 148z" />
        <path class="decorative-bloom" d="M220 190c18-40 42-40 60 0 40-18 60 2 42 42 38 18 38 42 0 60 18 40-2 60-42 42-18 38-42 38-60 0-40 18-60-2-42-42-38-18-38-42 0-60-18-40 2-60 42-42z" />
        <circle class="decorative-bloom-center" cx="262" cy="232" r="10" />
        <path class="decorative-seed" d="M405 638c42-30 70-30 105 0-35 30-63 30-105 0zM505 678c34-25 58-25 88 0-30 25-54 25-88 0z" />
      </g>
      <g v-else-if="templateId === 'love-letter'">
        <path class="decorative-envelope" d="M118 218h288v198H118zM120 224l142 112 142-112M120 410l105-90m174 90-105-90" />
        <path class="decorative-letter-heart" d="M932 260c-42-37-91 22 0 86 91-64 42-123 0-86z" />
        <path class="decorative-letter-lines" d="M810 422h228m-196 34h164m-206 34h246" />
        <path class="decorative-letter-stamp" d="M1018 570h88v88h-88zM1030 582h64v64h-64z" />
      </g>
      <g v-else>
        <path class="decorative-atlas-route" d="M94 670c105-140 158-42 256-146s147-198 269-116 157 34 251-92 148-105 236-172" />
        <circle class="decorative-map-point" cx="94" cy="670" r="12" />
        <circle class="decorative-map-point decorative-map-point-end" cx="1106" cy="144" r="12" />
        <circle class="decorative-compass" cx="1010" cy="620" r="64" />
        <path class="decorative-compass-needle" d="m1010 566 14 54-14 54-14-54zM956 620h108" />
        <path class="decorative-map-lines" d="M156 186h124m-62-62v124M430 680h136" />
      </g>
    </svg>
    <span v-if="templateId === 'editorial-rose'" class="decorative-twinkle decorative-twinkle-one" />
    <span v-if="templateId === 'editorial-rose' || templateId === 'midnight-cinema'" class="decorative-twinkle decorative-twinkle-two" />
    <span v-if="templateId === 'editorial-rose'" class="decorative-twinkle decorative-twinkle-three" />
    <span v-if="templateId === 'editorial-rose'" class="decorative-shooting-star" />
    <span v-if="templateId === 'memory-atlas'" class="decorative-atlas-pulse" />
    <span v-if="templateId === 'love-letter'" class="decorative-letter-seal">♡</span>
  </div>
</template>

<script setup lang="ts">
import type { StoryTemplateId } from '#shared/story-templates'

type DecorativeScene = 'hero' | 'entrance' | 'gallery' | 'book' | 'greeting' | 'detail' | 'finale'

withDefaults(defineProps<{
  templateId?: StoryTemplateId
  scene?: DecorativeScene
}>(), {
  templateId: 'editorial-rose',
  scene: 'hero',
})
</script>

<style scoped>
.decorative-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.decorative-layer svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  fill: none;
  stroke: rgb(241 217 168 / 50%);
  stroke-width: 1.2;
  vector-effect: non-scaling-stroke;
  transition: transform 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.decorative-scene-entrance svg {
  transform: scale(1.08) rotate(-3deg);
}

.decorative-scene-gallery svg {
  transform: scale(1.14) rotate(7deg);
}

.decorative-scene-book svg {
  transform: scale(0.88) rotate(-5deg);
}

.decorative-scene-greeting svg {
  transform: translateX(-3%) scale(1.04);
}

.decorative-scene-detail svg {
  transform: translateX(3%) scale(1.04);
}

.decorative-scene-finale svg {
  transform: scale(1.12) rotate(4deg);
}

.decorative-orbit {
  stroke-dasharray: 4 9;
  animation: orbit-draw 18s linear infinite;
}

.decorative-orbit-secondary {
  stroke: rgb(255 250 245 / 34%);
  stroke-dasharray: 2 12;
  animation-direction: reverse;
  animation-duration: 24s;
}

.decorative-curve {
  stroke: rgb(226 169 161 / 48%);
  stroke-dasharray: 350 700;
  stroke-dashoffset: 350;
  animation: curve-draw 8s ease-in-out infinite alternate;
}

.decorative-starburst {
  stroke: rgb(255 250 245 / 84%);
  stroke-width: 1.6;
  transform-box: fill-box;
  transform-origin: center;
  animation: sparkle-rotate 12s linear infinite;
}

.decorative-starburst-small {
  stroke: #f1d9a8;
  animation-direction: reverse;
}

.decorative-diamond {
  fill: #f1d9a8;
  stroke: none;
  animation: twinkle 3s ease-in-out infinite alternate;
}

.decorative-diamond-secondary {
  fill: #e2a9a1;
  animation-delay: 1.1s;
}

.decorative-moon {
  fill: rgb(255 246 214 / 12%);
  stroke: #ffe7a5;
  stroke-width: 1.4;
}

.decorative-cinema-orbit {
  fill: none;
  stroke: rgb(210 167 255 / 54%);
  stroke-dasharray: 2 14;
  animation: orbit-draw 26s linear infinite;
}

.decorative-cinema-frame,
.decorative-cinema-stars {
  fill: none;
  stroke: rgb(242 234 247 / 56%);
  stroke-width: 1.4;
}

.decorative-cinema-dot {
  fill: #d2a7ff;
  stroke: none;
}

.decorative-cinema-dot-small {
  fill: #ffe7a5;
}

.decorative-stem,
.decorative-leaf {
  fill: rgb(83 104 75 / 8%);
  stroke: rgb(83 104 75 / 62%);
  stroke-width: 1.8;
}

.decorative-leaf {
  transform-box: fill-box;
  transform-origin: bottom center;
  animation: leaf-sway 7s ease-in-out infinite alternate;
}

.decorative-bloom {
  fill: rgb(220 150 136 / 12%);
  stroke: rgb(83 104 75 / 62%);
}

.decorative-bloom-center,
.decorative-seed {
  fill: #c99a63;
  stroke: none;
}

.decorative-envelope,
.decorative-letter-lines,
.decorative-letter-stamp {
  fill: rgb(255 250 245 / 8%);
  stroke: rgb(153 93 80 / 62%);
  stroke-width: 1.8;
}

.decorative-letter-heart {
  fill: rgb(201 118 111 / 16%);
  stroke: #c9766f;
  stroke-width: 2;
  transform-box: fill-box;
  transform-origin: center;
  animation: twinkle 3s ease-in-out infinite alternate;
}

.decorative-letter-seal {
  position: absolute;
  top: 24%;
  right: 20%;
  display: grid;
  width: 3rem;
  aspect-ratio: 1;
  place-items: center;
  border: 1px solid rgb(153 93 80 / 50%);
  border-radius: 50%;
  color: #995d50;
  background: rgb(255 250 245 / 30%);
  font-family: 'Instrument Serif', serif;
  font-size: 1.5rem;
  transform: rotate(12deg);
}

.decorative-atlas-route,
.decorative-map-lines,
.decorative-compass-needle {
  fill: none;
  stroke: rgb(53 89 107 / 58%);
  stroke-width: 1.8;
}

.decorative-atlas-route {
  stroke-dasharray: 5 10;
  animation: orbit-draw 22s linear infinite;
}

.decorative-map-point,
.decorative-atlas-pulse {
  fill: #c98262;
  stroke: #fcf8ed;
  stroke-width: 3;
}

.decorative-map-point-end {
  fill: #557a83;
}

.decorative-compass {
  fill: rgb(53 89 107 / 5%);
  stroke: rgb(53 89 107 / 58%);
  stroke-width: 1.8;
}

.decorative-compass-needle {
  fill: rgb(201 130 98 / 55%);
}

.decorative-atlas-pulse {
  position: absolute;
  top: 22%;
  left: 18%;
  width: 0.8rem;
  aspect-ratio: 1;
  border-radius: 50%;
  box-shadow: 0 0 0 0.5rem rgb(201 130 98 / 12%);
  animation: map-pulse 2.8s ease-out infinite;
}

.decorative-layer[data-template='midnight-cinema'] svg {
  stroke: rgb(210 167 255 / 52%);
}

.decorative-layer[data-template='botanical-journal'] svg {
  stroke: rgb(83 104 75 / 52%);
}

.decorative-layer[data-template='love-letter'] svg {
  stroke: rgb(153 93 80 / 48%);
}

.decorative-layer[data-template='memory-atlas'] svg {
  stroke: rgb(53 89 107 / 48%);
}

.decorative-twinkle {
  position: absolute;
  width: 0.4rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #fffaf5;
  box-shadow: 0 0 1rem rgb(241 217 168 / 82%);
  animation: twinkle 2.4s ease-in-out infinite alternate;
}

.decorative-twinkle-one {
  top: 28%;
  left: 18%;
}

.decorative-twinkle-two {
  top: 36%;
  right: 17%;
  width: 0.25rem;
  animation-delay: 0.8s;
}

.decorative-twinkle-three {
  right: 27%;
  bottom: 20%;
  width: 0.32rem;
  animation-delay: 1.4s;
}

.decorative-shooting-star {
  position: absolute;
  top: 18%;
  right: 22%;
  width: 4.5rem;
  height: 1px;
  opacity: 0;
  background: linear-gradient(90deg, transparent, #fffaf5);
  transform: rotate(35deg);
  animation: shooting-star 8s ease-in-out infinite;
}

@keyframes twinkle {
  from { opacity: 0.35; transform: scale(0.75); }
  to { opacity: 1; transform: scale(1.15); }
}

@keyframes orbit-draw {
  to { stroke-dashoffset: -130; }
}

@keyframes curve-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes sparkle-rotate {
  to { rotate: 90deg; }
}

@keyframes shooting-star {
  0%, 74% { opacity: 0; translate: 0 0; }
  78% { opacity: 0.9; }
  88%, 100% { opacity: 0; translate: -9rem 6rem; }
}

@keyframes leaf-sway {
  to { rotate: 5deg; }
}

@keyframes map-pulse {
  70%, 100% { box-shadow: 0 0 0 1.2rem rgb(201 130 98 / 0%); }
}

@media (max-width: 640px) {
  .decorative-twinkle-three,
  .decorative-shooting-star,
  .decorative-letter-seal,
  .decorative-atlas-pulse {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .decorative-layer *,
  .decorative-layer *::before,
  .decorative-layer *::after {
    animation: none !important;
  }
}
</style>
