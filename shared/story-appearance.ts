import { z } from 'zod'
import { getTemplateDefinition, type StoryTemplateId } from './story-templates.ts'

export const STORY_FONT_OPTIONS = {
  'instrument-serif': {
    label: 'Instrument Serif',
    family: "'Instrument Serif', serif",
  },
  'dm-sans': {
    label: 'DM Sans',
    family: "'DM Sans', sans-serif",
  },
  'space-grotesk': {
    label: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
  },
} as const

const storyFontSchema = z.enum(['instrument-serif', 'dm-sans', 'space-grotesk'])
const hexColorSchema = z.string().regex(/^#[\da-f]{6}$/i)

export const storyAppearanceSchema = z.object({
  backgroundColor: hexColorSchema,
  accentColor: hexColorSchema,
  surfaceColor: hexColorSchema,
  textColor: hexColorSchema,
  displayFont: storyFontSchema,
  bodyFont: storyFontSchema,
}).strict()

export type StoryAppearance = z.infer<typeof storyAppearanceSchema>
export type StoryFontId = keyof typeof STORY_FONT_OPTIONS

const defaultTextColors: Record<StoryTemplateId, string> = {
  'editorial-rose': '#342923',
  'midnight-cinema': '#f2eaf7',
  'botanical-journal': '#283125',
  'love-letter': '#342923',
  'memory-atlas': '#253943',
}

export function createDefaultStoryAppearance(templateId: StoryTemplateId): StoryAppearance {
  const template = getTemplateDefinition(templateId)
  const colors = template?.colors ?? ['#f8e6e3', '#a94d58', '#fffaf5']

  return {
    backgroundColor: colors[0],
    accentColor: colors[1],
    surfaceColor: colors[2],
    textColor: defaultTextColors[templateId],
    displayFont: 'instrument-serif',
    bodyFont: template?.fontPair.includes('Space Grotesk') ? 'space-grotesk' : 'dm-sans',
  }
}

export function getStoryAppearanceCssVariables(
  appearance: StoryAppearance,
): Record<string, string> {
  return {
    '--story-background-color': appearance.backgroundColor,
    '--story-accent-color': appearance.accentColor,
    '--story-surface-color': appearance.surfaceColor,
    '--story-text-color': appearance.textColor,
    '--story-accent-contrast-color': contrastColor(appearance.accentColor),
    '--story-font-display': STORY_FONT_OPTIONS[appearance.displayFont].family,
    '--story-font-body': STORY_FONT_OPTIONS[appearance.bodyFont].family,
  }
}

function contrastColor(hex: string): string {
  const channel = (index: number) => Number.parseInt(hex.slice(index, index + 2), 16) / 255
  const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  const luminance = linear(channel(1)) * 0.2126
    + linear(channel(3)) * 0.7152
    + linear(channel(5)) * 0.0722

  return luminance > 0.179 ? '#201d28' : '#ffffff'
}
