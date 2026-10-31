import { z } from 'zod'
import { storyCursorSchema, storyTemplateSchema } from './story'

const draftText = (limit: number) => z.string().max(limit).optional()
const draftUrl = z.string().max(2048).optional()

export const storyDraftSchema = z.object({
  activeStep: z.number().int().min(0).max(6).optional(),
  editingSlug: z.string().regex(/^[a-f0-9]{12}$/).optional(),
  templateId: storyTemplateSchema.optional(),
  cursorPreset: storyCursorSchema.optional(),
  templateDetails: z.object({
    editorialRose: z.object({
      dedication: draftText(180),
      signature: draftText(80),
    }).strict().optional(),
    midnightCinema: z.object({
      openingQuote: draftText(220),
      credits: draftText(120),
    }).strict().optional(),
    botanicalJournal: z.object({
      journalLabel: draftText(80),
      fieldNote: draftText(220),
    }).strict().optional(),
  }).strict().optional(),
  title: draftText(100),
  coupleNames: draftText(100),
  date: draftText(80),
  heroImage: draftUrl,
  greetingImage: draftUrl,
  greetingVideoUrl: draftUrl,
  greetingText: draftText(1000),
  gallery: z.array(z.object({
    url: draftUrl,
    caption: draftText(120),
  })).max(12).optional(),
  secondImage: draftUrl,
  detailTitle: draftText(100),
  detailText: draftText(1000),
  storyPages: z.array(z.object({
    title: draftText(100),
    text: draftText(1200),
    image: draftUrl,
  })).max(8).optional(),
  finalImage: draftUrl,
  finalMessage: draftText(1000),
  musicUrl: draftUrl,
}).strict()

export type StoryDraft = z.infer<typeof storyDraftSchema>
