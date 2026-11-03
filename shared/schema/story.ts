import { z } from 'zod'
import { storySlugPattern } from '../story-slug.ts'
import {
  getTemplateDefinition,
  storyTemplateSchema,
  templateDetailsSchema,
  templateEntranceStyleSchema,
} from '../story-templates.ts'
import {
  storySectionContentSchema,
  storySectionLayoutSchema,
  validateStorySectionContent,
} from '../story-sections.ts'
import { storyAppearanceSchema } from '../story-appearance.ts'

export { storyTemplateSchema }

const httpsUrl = z.url({ protocol: /^https$/ }).max(2048)
const imageUrl = httpsUrl
const optionalImageUrl = z.union([z.literal(''), imageUrl])
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
export const storyContentSchema = z.object({
  templateId: storyTemplateSchema.optional(),
  entranceStyle: templateEntranceStyleSchema.optional(),
  cursorPreset: storyCursorSchema.optional(),
  templateDetails: templateDetailsSchema.optional(),
  appearance: storyAppearanceSchema.optional(),
  sectionLayout: storySectionLayoutSchema.optional(),
  sectionContent: storySectionContentSchema.optional(),
  title: z.string().trim().min(1).max(100),
  coupleNames: z.string().trim().min(1).max(100),
  date: z.string().trim().min(1).max(80),
  heroImage: imageUrl,
  greetingImage: optionalImageUrl,
  greetingVideoUrl: z.union([z.literal(''), httpsUrl]),
  greetingText: z.string().trim().max(1000),
  gallery: z.array(z.object({
    url: optionalImageUrl,
    caption: z.string().trim().max(120),
  })).max(12).default([]),
  secondImage: optionalImageUrl,
  detailTitle: z.string().trim().max(100),
  detailText: z.string().trim().max(1000),
  storyPages: z.array(z.object({
    title: z.string().trim().max(100),
    text: z.string().trim().max(1200),
    image: optionalImageUrl,
  })).max(8).default([]),
  finalImage: optionalImageUrl,
  finalMessage: z.string().trim().max(1000),
  musicUrl: z.union([z.literal(''), httpsUrl]),
  musicTitle: z.string().trim().max(120).optional(),
  musicArtist: z.string().trim().max(120).optional(),
}).superRefine((story, context) => {
  const template = getTemplateDefinition(story.templateId ?? 'editorial-rose')
  const activeSectionTypes = new Set(
    (story.sectionLayout ?? template?.sections ?? [])
      .filter(section => section.enabled)
      .map(section => section.type),
  )

  function requireText(value: string, path: (string | number)[], label: string): void {
    if (value.trim()) return
    context.addIssue({
      code: 'custom',
      path,
      message: `${label} wajib diisi untuk section yang aktif.`,
    })
  }

  function requireImage(value: string, path: (string | number)[], label: string): void {
    if (value) return
    context.addIssue({
      code: 'custom',
      path,
      message: `${label} wajib dipilih untuk section yang aktif.`,
    })
  }

  if (template?.customizationKey && story.templateDetails) {
    const value = story.templateDetails[template.customizationKey]
    if (value !== undefined) {
      const parsed = template.schema.safeParse(value)
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          context.addIssue({
            ...issue,
            path: ['templateDetails', template.customizationKey, ...issue.path],
          })
        }
      }
    }
  }

  if (activeSectionTypes.has('greeting')) {
    requireImage(story.greetingImage, ['greetingImage'], 'Latar kartu ucapan')
    requireText(story.greetingText, ['greetingText'], 'Tulisan kartu ucapan')
  }
  if (activeSectionTypes.has('gallery')) {
    if (!story.gallery.length) {
      requireImage('', ['gallery'], 'Setidaknya satu foto galeri')
    }
    story.gallery.forEach((photo, index) => {
      requireImage(photo.url, ['gallery', index, 'url'], `Foto galeri ${index + 1}`)
    })
  }
  if (activeSectionTypes.has('first-encounter')) {
    requireImage(story.secondImage, ['secondImage'], 'Foto pertemuan pertama')
    requireText(story.detailTitle, ['detailTitle'], 'Judul pertemuan pertama')
    requireText(story.detailText, ['detailText'], 'Cerita pertemuan pertama')
  }
  if (activeSectionTypes.has('timeline') || activeSectionTypes.has('book') || activeSectionTypes.has('constellation')) {
    if (!story.storyPages.length) {
      requireText('', ['storyPages'], 'Setidaknya satu bab cerita')
    }
    story.storyPages.forEach((page, index) => {
      requireText(page.title, ['storyPages', index, 'title'], `Judul bab ${index + 1}`)
      requireText(page.text, ['storyPages', index, 'text'], `Isi bab ${index + 1}`)
      if (activeSectionTypes.has('timeline') || activeSectionTypes.has('book')) {
        requireImage(page.image, ['storyPages', index, 'image'], `Foto bab ${index + 1}`)
      }
    })
  }
  if (activeSectionTypes.has('finale')) {
    requireImage(story.finalImage, ['finalImage'], 'Foto penutup')
    requireText(story.finalMessage, ['finalMessage'], 'Pesan penutup')
  }

  const sectionIssues = validateStorySectionContent(
    story.sectionLayout ?? template?.sections ?? [],
    story.sectionContent,
    {
      greetingVideoUrl: story.greetingVideoUrl,
      musicUrl: story.musicUrl,
    },
  )
  for (const issue of sectionIssues) {
    context.addIssue({
      code: 'custom',
      path: ['sectionContent', issue.type],
      message: issue.message,
    })
  }

  story.sectionLayout?.forEach((section, index) => {
    if (!section.enabled) return
    const background = section.design?.background
    if (background?.type !== 'image' && background?.type !== 'video') return
    if (httpsUrl.safeParse(background.url).success) return

    context.addIssue({
      code: 'custom',
      path: ['sectionLayout', index, 'design', 'background', 'url'],
      message: 'Latar foto atau video harus menggunakan tautan HTTPS yang valid.',
    })
  })
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
