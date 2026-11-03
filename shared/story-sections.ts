import { z } from 'zod'

export const STORY_SECTION_TYPES = [
  'hero',
  'greeting',
  'first-encounter',
  'gallery',
  'moments-in-motion',
  'music',
  'timeline',
  'love-notes',
  'constellation',
  'distance-map',
  'future-dreams',
  'countdown',
  'memory-capsule',
  'book',
  'finale',
] as const

export const storySectionVariants = {
  hero: ['cover-story', 'cinema-poster', 'field-notes', 'letter-cover', 'atlas-cover'],
  greeting: ['letter', 'film-scene', 'journal-entry', 'love-letter', 'travel-note'],
  'first-encounter': ['editorial', 'cinematic', 'field-note', 'first-meeting', 'map-pin'],
  gallery: ['photo-wall', 'film-strip', 'specimen-grid', 'polaroid', 'archive'],
  'moments-in-motion': ['cinematic', 'scrapbook', 'travel-film'],
  music: ['player-card', 'soundtrack', 'listening-note'],
  timeline: ['vertical', 'cinematic', 'observation-log', 'chapter-ledger', 'route-log'],
  'love-notes': ['letters', 'notes-wall', 'postcards'],
  constellation: ['night-sky', 'star-map', 'memory-orbit'],
  'distance-map': ['route', 'postcard', 'coordinates'],
  'future-dreams': ['wish-list', 'horizon', 'shared-plan'],
  countdown: ['minimal', 'calendar', 'anniversary'],
  'memory-capsule': ['sealed-letter', 'time-lock', 'keepsake'],
  book: ['open-book', 'feature-book', 'journal', 'travel-journal'],
  finale: ['closing-letter', 'credits', 'last-page', 'sealed-note', 'closing-coordinates'],
} as const satisfies Record<typeof STORY_SECTION_TYPES[number], readonly string[]>

export type StorySectionType = typeof STORY_SECTION_TYPES[number]
export type StorySectionVariant<T extends StorySectionType = StorySectionType> =
  typeof storySectionVariants[T][number]
export type StorySectionEntrance = 'fade-up' | 'slide-left' | 'slide-right' | 'zoom'
export type StorySectionScrollEffect = 'none' | 'parallax' | 'fade'

const storySectionTypeSchema = z.enum(STORY_SECTION_TYPES)

export const storySectionSchema = z.object({
  id: z.string().trim().min(1).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  type: storySectionTypeSchema,
  variant: z.string().trim().min(1).max(48),
  enabled: z.boolean(),
  order: z.number().int().min(0).max(STORY_SECTION_TYPES.length - 1),
  animation: z.object({
    entrance: z.enum(['fade-up', 'slide-left', 'slide-right', 'zoom']),
    scroll: z.enum(['none', 'parallax', 'fade']),
  }).strict(),
}).strict().superRefine((section, context) => {
  const variants: readonly string[] = storySectionVariants[section.type]
  if (!variants.includes(section.variant)) {
    context.addIssue({
      code: 'custom',
      path: ['variant'],
      message: `Variasi tidak tersedia untuk section ${section.type}.`,
    })
  }
})

export const storySectionLayoutSchema = z.array(storySectionSchema)
  .max(STORY_SECTION_TYPES.length)
  .superRefine((sections, context) => {
    const ids = new Set<string>()
    const types = new Set<StorySectionType>()

    sections.forEach((section, index) => {
      if (ids.has(section.id)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: 'ID section harus unik.',
        })
      }
      if (types.has(section.type)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'type'],
          message: 'Setiap jenis section hanya dapat digunakan satu kali.',
        })
      }
      ids.add(section.id)
      types.add(section.type)
    })
  })

export const storySectionContentSchema = z.object({
  loveNotes: z.array(z.string().max(500)).max(12).optional(),
  distanceMap: z.object({
    origin: z.string().max(120).optional(),
    destination: z.string().max(120).optional(),
    note: z.string().max(500).optional(),
  }).strict().optional(),
  futureDreams: z.array(z.string().max(240)).max(12).optional(),
  countdown: z.object({
    title: z.string().max(120).optional(),
    targetDate: z.union([z.literal(''), z.iso.date()]).optional(),
  }).strict().optional(),
  memoryCapsule: z.object({
    title: z.string().max(120).optional(),
    unlockDate: z.union([z.literal(''), z.iso.date()]).optional(),
    message: z.string().max(2000).optional(),
  }).strict().optional(),
}).strict()

export type StorySectionConfig = z.infer<typeof storySectionSchema>
export type StorySectionContent = z.infer<typeof storySectionContentSchema>

const sectionAnimationDefaults: Record<StorySectionType, StorySectionConfig['animation']> = {
  hero: { entrance: 'zoom', scroll: 'parallax' },
  greeting: { entrance: 'fade-up', scroll: 'parallax' },
  'first-encounter': { entrance: 'slide-left', scroll: 'fade' },
  gallery: { entrance: 'fade-up', scroll: 'parallax' },
  'moments-in-motion': { entrance: 'slide-right', scroll: 'fade' },
  music: { entrance: 'fade-up', scroll: 'none' },
  timeline: { entrance: 'slide-left', scroll: 'fade' },
  'love-notes': { entrance: 'fade-up', scroll: 'none' },
  constellation: { entrance: 'zoom', scroll: 'parallax' },
  'distance-map': { entrance: 'slide-right', scroll: 'parallax' },
  'future-dreams': { entrance: 'fade-up', scroll: 'none' },
  countdown: { entrance: 'zoom', scroll: 'none' },
  'memory-capsule': { entrance: 'fade-up', scroll: 'none' },
  book: { entrance: 'fade-up', scroll: 'none' },
  finale: { entrance: 'zoom', scroll: 'parallax' },
}

export function createDefaultSectionConfig(
  type: StorySectionType,
  order: number,
  variant: string = storySectionVariants[type][0],
): StorySectionConfig {
  const parsed = storySectionSchema.parse({
    id: type,
    type,
    variant,
    enabled: true,
    order,
    animation: sectionAnimationDefaults[type],
  })
  return parsed
}

export function createEmptyStorySectionContent(): StorySectionContent {
  return {
    loveNotes: [],
    distanceMap: { origin: '', destination: '', note: '' },
    futureDreams: [],
    countdown: { title: '', targetDate: '' },
    memoryCapsule: { title: '', unlockDate: '', message: '' },
  }
}

export function sortStorySections(sections: readonly StorySectionConfig[]): StorySectionConfig[] {
  return sections.filter(section => section.enabled).sort((left, right) => left.order - right.order)
}

export function validateStorySectionContent(
  sections: readonly StorySectionConfig[],
  content: StorySectionContent | undefined,
  available: {
    greetingVideoUrl: string
    musicUrl: string
  },
): Array<{ type: StorySectionType, message: string }> {
  const issues: Array<{ type: StorySectionType, message: string }> = []
  const activeTypes = new Set(sections.filter(section => section.enabled).map(section => section.type))

  if (activeTypes.has('moments-in-motion') && !available.greetingVideoUrl.trim()) {
    issues.push({ type: 'moments-in-motion', message: 'Tambahkan video ucapan sebelum mengaktifkan section ini.' })
  }
  if (activeTypes.has('music') && !available.musicUrl.trim()) {
    issues.push({ type: 'music', message: 'Tambahkan lagu sebelum mengaktifkan section ini.' })
  }
  if (activeTypes.has('love-notes') && !content?.loveNotes?.some(note => note.trim())) {
    issues.push({ type: 'love-notes', message: 'Tambahkan setidaknya satu catatan cinta.' })
  }
  if (
    activeTypes.has('distance-map')
    && (!content?.distanceMap?.origin?.trim() || !content.distanceMap.destination?.trim())
  ) {
    issues.push({ type: 'distance-map', message: 'Lengkapi titik awal dan tujuan perjalanan.' })
  }
  if (activeTypes.has('future-dreams') && !content?.futureDreams?.some(dream => dream.trim())) {
    issues.push({ type: 'future-dreams', message: 'Tambahkan setidaknya satu rencana bersama.' })
  }
  if (
    activeTypes.has('countdown')
    && (!content?.countdown?.title?.trim() || !content.countdown.targetDate)
  ) {
    issues.push({ type: 'countdown', message: 'Lengkapi judul dan tanggal hitung mundur.' })
  }
  if (
    activeTypes.has('memory-capsule')
    && (
      !content?.memoryCapsule?.title?.trim()
      || !content?.memoryCapsule?.unlockDate
      || !content.memoryCapsule?.message?.trim()
    )
  ) {
    issues.push({ type: 'memory-capsule', message: 'Lengkapi judul, tanggal buka, dan isi kapsul.' })
  }

  return issues
}
