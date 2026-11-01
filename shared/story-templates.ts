import { z } from 'zod'
import type { TemplateCategoryId } from './template-categories.ts'

export const templateCustomizationSchemas = {
  editorialRose: z.object({
    dedication: z.string().max(180).optional(),
    signature: z.string().max(80).optional(),
  }).strict(),
  midnightCinema: z.object({
    openingQuote: z.string().max(220).optional(),
    credits: z.string().max(120).optional(),
  }).strict(),
  botanicalJournal: z.object({
    journalLabel: z.string().max(80).optional(),
    fieldNote: z.string().max(220).optional(),
  }).strict(),
  noCustomization: z.object({}).strict(),
} as const

export const templateDetailsSchema = z.object({
  editorialRose: templateCustomizationSchemas.editorialRose.optional(),
  midnightCinema: templateCustomizationSchemas.midnightCinema.optional(),
  botanicalJournal: templateCustomizationSchemas.botanicalJournal.optional(),
}).strict()

export type TemplateDetails = z.infer<typeof templateDetailsSchema>
export type TemplateCustomizationKey = keyof TemplateDetails
export type TemplateRendererId =
  | 'EditorialRoseLayout'
  | 'MidnightCinemaLayout'
  | 'BotanicalJournalLayout'
  | 'LoveLetterLayout'
  | 'MemoryAtlasLayout'
export type TemplateFeature =
  | 'book'
  | 'chapters'
  | 'custom-copy'
  | 'gallery'
  | 'music'
  | 'video-greeting'
export type TemplateStatus = 'available' | 'planned'

interface TemplateDefinition {
  id: string
  name: string
  description: string
  category: TemplateCategoryId
  mood: string
  previewLabel: string
  layout: string
  thumbnail: string
  renderer: TemplateRendererId
  schema: z.ZodType
  defaults: Record<string, string>
  customizationKey: TemplateCustomizationKey | null
  features: readonly TemplateFeature[]
  status: TemplateStatus
  highlights: readonly string[]
  colors: readonly [string, string, string]
}

const commonFeatures = ['book', 'chapters', 'gallery', 'music', 'video-greeting'] as const satisfies readonly TemplateFeature[]
const customCopyFeatures = [...commonFeatures, 'custom-copy'] as const satisfies readonly TemplateFeature[]

export const storyTemplates = [
  {
    id: 'editorial-rose',
    category: 'couple',
    name: 'Editorial Rose',
    mood: 'Lembut, editorial, dan romantis',
    description: 'Sampul majalah cinta dengan dedikasi personal, tipografi serif, dan tata letak yang lapang.',
    previewLabel: 'Edisi kenangan',
    layout: 'Majalah cinta',
    thumbnail: '/previews/cover.svg',
    renderer: 'EditorialRoseLayout',
    schema: templateCustomizationSchemas.editorialRose,
    defaults: { dedication: '', signature: '' },
    customizationKey: 'editorialRose',
    features: customCopyFeatures,
    status: 'available',
    highlights: ['Sampul editorial', 'Foto bergaya cetak', 'Dedikasi & tanda tangan'],
    colors: ['#f8e6e3', '#a94d58', '#fffaf5'],
  },
  {
    id: 'midnight-cinema',
    category: 'couple',
    name: 'Midnight Cinema',
    mood: 'Sinematik, gelap, dan intim',
    description: 'Seperti film pendek kalian: kutipan pembuka, suasana malam, dan kredit penutup.',
    previewLabel: 'Satu film tentang kita',
    layout: 'Film pendek',
    thumbnail: '/previews/cover.svg',
    renderer: 'MidnightCinemaLayout',
    schema: templateCustomizationSchemas.midnightCinema,
    defaults: { openingQuote: '', credits: '' },
    customizationKey: 'midnightCinema',
    features: customCopyFeatures,
    status: 'available',
    highlights: ['Sampul sinematik', 'Galeri seperti film', 'Kutipan & kredit penutup'],
    colors: ['#18151d', '#d2a7ff', '#f2eaf7'],
  },
  {
    id: 'botanical-journal',
    category: 'couple',
    name: 'Botanical Journal',
    mood: 'Hangat, natural, seperti jurnal perjalanan',
    description: 'Jurnal perjalanan yang hangat dengan catatan lapangan dan aksen alam.',
    previewLabel: 'Jurnal perjalanan',
    layout: 'Jurnal perjalanan',
    thumbnail: '/previews/cover.svg',
    renderer: 'BotanicalJournalLayout',
    schema: templateCustomizationSchemas.botanicalJournal,
    defaults: { journalLabel: '', fieldNote: '' },
    customizationKey: 'botanicalJournal',
    features: customCopyFeatures,
    status: 'available',
    highlights: ['Foto cetak jurnal', 'Catatan lapangan', 'Halaman bernuansa kertas'],
    colors: ['#e7ebd8', '#53684b', '#fcf8ed'],
  },
  {
    id: 'love-letter',
    category: 'couple',
    name: 'Love Letter',
    mood: 'Intim, hangat, seperti surat tulisan tangan',
    description: 'Kenangan disusun seperti surat cinta: kertas bertekstur, catatan personal, dan foto-foto yang disimpan di antara halaman.',
    previewLabel: 'Surat untuk selamanya',
    layout: 'Surat cinta',
    thumbnail: '/previews/cover.svg',
    renderer: 'LoveLetterLayout',
    schema: templateCustomizationSchemas.editorialRose,
    defaults: { dedication: '', signature: '' },
    customizationKey: 'editorialRose',
    features: customCopyFeatures,
    status: 'available',
    highlights: ['Pembuka seperti surat', 'Foto bergaya polaroid', 'Buku kenangan bertekstur'],
    colors: ['#f5e8d5', '#995d50', '#342923'],
  },
  {
    id: 'memory-atlas',
    category: 'couple',
    name: 'Memory Atlas',
    mood: 'Dokumenter perjalanan dengan garis waktu editorial',
    description: 'Sebuah arsip perjalanan: pembuka seperti sampul peta, momen tersusun di sepanjang garis waktu, lalu bab dan penutup sebagai catatan perjalanan.',
    previewLabel: 'Arsip perjalanan',
    layout: 'Atlas kenangan',
    thumbnail: '/previews/cover.svg',
    renderer: 'MemoryAtlasLayout',
    schema: templateCustomizationSchemas.noCustomization,
    defaults: {},
    customizationKey: null,
    features: commonFeatures,
    status: 'available',
    highlights: ['Garis waktu vertikal', 'Arsip foto horizontal', 'Bab perjalanan berurutan'],
    colors: ['#e8e2d2', '#35596b', '#253943'],
  },
] as const satisfies readonly TemplateDefinition[]

export const availableStoryTemplates = storyTemplates.filter(template => template.status === 'available')

export type StoryTemplateId = typeof storyTemplates[number]['id']
export type StoryTemplateDefinition = typeof storyTemplates[number]
export const storyTemplateSchema = z.custom<StoryTemplateId>(
  (value): value is StoryTemplateId => typeof value === 'string'
    && storyTemplates.some(template => template.id === value),
  { message: 'Template tidak terdaftar.' },
)

export function getTemplateDefinition(id: string | undefined): StoryTemplateDefinition | undefined {
  return storyTemplates.find(template => template.id === id)
}

export function parseTemplateCustomization(
  id: string,
  value: unknown,
): ReturnType<z.ZodType['safeParse']> | null {
  const template = getTemplateDefinition(id)
  return template ? template.schema.safeParse(value) : null
}

export function createTemplateCustomization(id: StoryTemplateId): TemplateDetails {
  const template = getTemplateDefinition(id)
  if (!template || !template.customizationKey) return {}

  switch (template.customizationKey) {
    case 'editorialRose':
      return { editorialRose: templateCustomizationSchemas.editorialRose.parse(template.defaults) }
    case 'midnightCinema':
      return { midnightCinema: templateCustomizationSchemas.midnightCinema.parse(template.defaults) }
    case 'botanicalJournal':
      return { botanicalJournal: templateCustomizationSchemas.botanicalJournal.parse(template.defaults) }
  }
}
