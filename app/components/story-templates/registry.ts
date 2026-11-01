import type { Component } from 'vue'
import BotanicalJournalLayout from './layouts/BotanicalJournalLayout.vue'
import EditorialRoseLayout from './layouts/EditorialRoseLayout.vue'
import LoveLetterLayout from './layouts/LoveLetterLayout.vue'
import MemoryAtlasLayout from './layouts/MemoryAtlasLayout.vue'
import MidnightCinemaLayout from './layouts/MidnightCinemaLayout.vue'
import type { TemplateRendererId } from '#shared/story-templates'

export const templateRenderers = {
  EditorialRoseLayout,
  MidnightCinemaLayout,
  BotanicalJournalLayout,
  LoveLetterLayout,
  MemoryAtlasLayout,
} satisfies Record<TemplateRendererId, Component>
