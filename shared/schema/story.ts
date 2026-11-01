import { z } from 'zod'
import { storySlugPattern } from '../story-slug.ts'

const httpsUrl = z.url({ protocol: /^https$/ }).max(2048)
const imageUrl = httpsUrl
export const storyTemplateSchema = z.enum(['editorial-rose', 'midnight-cinema', 'botanical-journal', 'love-letter', 'memory-atlas'])
export const storyCursorSchema = z.enum(['ring', 'heart', 'sparkle', 'flower', 'star', 'system'])
const customSlugSchema = z.string()
  .trim()
  .toLowerCase()
  .max(32)
  .optional()
  .transform(value => value || undefined)
  .refine(value => value === undefined || storySlugPattern.test(value), {
    message: 'Link khusus harus berisi 3–32 huruf kecil, angka, atau tanda hubung.',
  })
const templateDetailsSchema = z.object({
  editorialRose: z.object({
    dedication: z.string().max(180).optional(),
    signature: z.string().max(80).optional(),
  }).strict().optional(),
  midnightCinema: z.object({
    openingQuote: z.string().max(220).optional(),
    credits: z.string().max(120).optional(),
  }).strict().optional(),
  botanicalJournal: z.object({
    journalLabel: z.string().max(80).optional(),
    fieldNote: z.string().max(220).optional(),
  }).strict().optional(),
}).strict()

export const storyContentSchema = z.object({
  templateId: storyTemplateSchema.optional(),
  cursorPreset: storyCursorSchema.optional(),
  templateDetails: templateDetailsSchema.optional(),
  title: z.string().trim().min(1).max(100),
  coupleNames: z.string().trim().min(1).max(100),
  date: z.string().trim().min(1).max(80),
  heroImage: imageUrl,
  greetingImage: imageUrl,
  greetingVideoUrl: z.union([z.literal(''), httpsUrl]),
  greetingText: z.string().trim().min(1).max(1000),
  gallery: z.array(z.object({
    url: imageUrl,
    caption: z.string().trim().max(120),
  })).min(1).max(12),
  secondImage: imageUrl,
  detailTitle: z.string().trim().min(1).max(100),
  detailText: z.string().trim().min(1).max(1000),
  storyPages: z.array(z.object({
    title: z.string().trim().min(1).max(100),
    text: z.string().trim().min(1).max(1200),
    image: imageUrl,
  })).min(1).max(8),
  finalImage: imageUrl,
  finalMessage: z.string().trim().min(1).max(1000),
  musicUrl: z.union([z.literal(''), httpsUrl]),
})

export const publishStorySchema = storyContentSchema.extend({
  draftId: z.string().regex(/^[a-f0-9]{32}$/).optional(),
  customSlug: customSlugSchema,
  password: z.string().max(128).optional().transform((value) => value?.trim() || undefined),
  removePassword: z.boolean().optional(),
})

export const updateStorySchema = storyContentSchema.extend({
  draftId: z.string().regex(/^[a-f0-9]{32}$/).optional(),
  customSlug: customSlugSchema,
  password: z.string().max(128).optional().transform((value) => value?.trim() || undefined),
  removePassword: z.boolean().optional(),
})

export const unlockStorySchema = z.object({
  password: z.string().min(1).max(128),
})

export type StoryContent = z.infer<typeof storyContentSchema>
export type PublishStoryInput = z.infer<typeof publishStorySchema>
