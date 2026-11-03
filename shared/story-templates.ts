import { z } from 'zod'
import type { TemplateCategoryId } from './template-categories.ts'
import {
  createDefaultSectionConfig,
  type StorySectionConfig,
  type StorySectionType,
} from './story-sections.ts'

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
export const templateEntranceStyles = [
  {
    style: 'editorial',
    label: 'Editorial',
    description: 'Sampul majalah yang hangat dan lapang.',
    actionLabel: 'Buka cerita kami',
  },
  {
    style: 'cinema',
    label: 'Sinematik',
    description: 'Suasana gelap seperti awal sebuah film.',
    actionLabel: 'Mulai cerita',
  },
  {
    style: 'botanical',
    label: 'Botanical',
    description: 'Pembuka alami dengan sentuhan jurnal.',
    actionLabel: 'Buka jurnal',
  },
  {
    style: 'letter',
    label: 'Surat cinta',
    description: 'Kesan personal seperti membuka surat.',
    actionLabel: 'Buka surat',
  },
  {
    style: 'atlas',
    label: 'Atlas kenangan',
    description: 'Pembuka dokumenter untuk perjalanan kalian.',
    actionLabel: 'Jelajahi cerita',
  },
] as const

export const templateEntranceStyleSchema = z.enum([
  'editorial',
  'cinema',
  'botanical',
  'letter',
  'atlas',
])
export type TemplateEntranceStyle = z.infer<typeof templateEntranceStyleSchema>

export interface TemplateEntranceConfig {
  style: TemplateEntranceStyle
  actionLabel: string
}

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
  sections: readonly StorySectionConfig[]
  status: TemplateStatus
  highlights: readonly string[]
  colors: readonly [string, string, string]
  fontPair: string
  entrance: TemplateEntranceConfig
}

const commonFeatures = ['book', 'chapters', 'gallery', 'music', 'video-greeting'] as const satisfies readonly TemplateFeature[]
const customCopyFeatures = [...commonFeatures, 'custom-copy'] as const satisfies readonly TemplateFeature[]

function defineSections(
  definitions: readonly (readonly [StorySectionType, string])[],
): StorySectionConfig[] {
  return definitions.map(([type, variant], order) => createDefaultSectionConfig(type, order, variant))
}

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
    sections: defineSections([
      ['hero', 'cover-story'],
      ['greeting', 'letter'],
      ['gallery', 'photo-wall'],
      ['first-encounter', 'editorial'],
      ['timeline', 'vertical'],
      ['book', 'open-book'],
      ['finale', 'closing-letter'],
    ]),
    status: 'available',
    highlights: ['Sampul editorial', 'Foto bergaya cetak', 'Dedikasi & tanda tangan'],
    colors: ['#f8e6e3', '#a94d58', '#fffaf5'],
    fontPair: 'Instrument Serif · DM Sans',
    entrance: { style: 'editorial', actionLabel: 'Buka cerita kami' },
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
    sections: defineSections([
      ['hero', 'cinema-poster'],
      ['gallery', 'film-strip'],
      ['greeting', 'film-scene'],
      ['first-encounter', 'cinematic'],
      ['timeline', 'cinematic'],
      ['book', 'feature-book'],
      ['finale', 'credits'],
    ]),
    status: 'available',
    highlights: ['Sampul sinematik', 'Galeri seperti film', 'Kutipan & kredit penutup'],
    colors: ['#18151d', '#d2a7ff', '#f2eaf7'],
    fontPair: 'Instrument Serif · Space Grotesk',
    entrance: { style: 'cinema', actionLabel: 'Mulai cerita' },
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
    sections: defineSections([
      ['hero', 'field-notes'],
      ['greeting', 'journal-entry'],
      ['first-encounter', 'field-note'],
      ['gallery', 'specimen-grid'],
      ['timeline', 'observation-log'],
      ['book', 'journal'],
      ['finale', 'last-page'],
    ]),
    status: 'available',
    highlights: ['Foto cetak jurnal', 'Catatan lapangan', 'Halaman bernuansa kertas'],
    colors: ['#e7ebd8', '#53684b', '#fcf8ed'],
    fontPair: 'Instrument Serif · Space Grotesk',
    entrance: { style: 'botanical', actionLabel: 'Buka jurnal' },
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
    sections: defineSections([
      ['hero', 'letter-cover'],
      ['greeting', 'love-letter'],
      ['gallery', 'polaroid'],
      ['first-encounter', 'first-meeting'],
      ['timeline', 'chapter-ledger'],
      ['book', 'journal'],
      ['finale', 'sealed-note'],
    ]),
    status: 'available',
    highlights: ['Pembuka seperti surat', 'Foto bergaya polaroid', 'Buku kenangan bertekstur'],
    colors: ['#f5e8d5', '#995d50', '#342923'],
    fontPair: 'Instrument Serif · DM Sans',
    entrance: { style: 'letter', actionLabel: 'Buka surat' },
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
    sections: defineSections([
      ['hero', 'atlas-cover'],
      ['greeting', 'travel-note'],
      ['first-encounter', 'map-pin'],
      ['gallery', 'archive'],
      ['timeline', 'route-log'],
      ['book', 'travel-journal'],
      ['finale', 'closing-coordinates'],
    ]),
    status: 'available',
    highlights: ['Garis waktu vertikal', 'Arsip foto horizontal', 'Bab perjalanan berurutan'],
    colors: ['#e8e2d2', '#35596b', '#253943'],
    fontPair: 'Instrument Serif · Space Grotesk',
    entrance: { style: 'atlas', actionLabel: 'Jelajahi cerita' },
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

export function getTemplateEntrance(style: TemplateEntranceStyle | undefined, templateId: string | undefined): TemplateEntranceConfig {
  if (style) {
    const option = templateEntranceStyles.find(entrance => entrance.style === style)
    if (option) return { style: option.style, actionLabel: option.actionLabel }
  }
  return getTemplateDefinition(templateId)?.entrance ?? storyTemplates[0].entrance
}

export function createDefaultSectionLayout(id: StoryTemplateId): StorySectionConfig[] {
  const template = getTemplateDefinition(id)
  return template ? template.sections.map(section => ({ ...section, animation: { ...section.animation } })) : []
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
