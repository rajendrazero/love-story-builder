import { z } from 'zod'

const httpsUrl = z.url({ protocol: /^https$/ }).max(2048)
const imageUrl = httpsUrl

export const storyContentSchema = z.object({
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
  password: z.string().max(128).optional().transform((value) => value?.trim() || undefined),
})

export const unlockStorySchema = z.object({
  password: z.string().min(1).max(128),
})

export type StoryContent = z.infer<typeof storyContentSchema>
export type PublishStoryInput = z.infer<typeof publishStorySchema>
