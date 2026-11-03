import assert from 'node:assert/strict'
import { test } from 'node:test'
import { storyContentSchema } from '../shared/schema/story.ts'
import {
  createDefaultStoryAppearance,
  getStoryAppearanceCssVariables,
  storyAppearanceSchema,
} from '../shared/story-appearance.ts'
import {
  createDefaultSectionConfig,
  createDefaultStorySectionDesign,
  storySectionDesignSchema,
} from '../shared/story-sections.ts'

const story = {
  title: 'A story about us',
  coupleNames: 'Alya & Bima',
  date: 'Since 2022',
  heroImage: 'https://example.com/hero.jpg',
  greetingImage: 'https://example.com/greeting.jpg',
  greetingVideoUrl: '',
  greetingText: 'A note for you',
  gallery: [{ url: 'https://example.com/gallery.jpg', caption: 'Our day' }],
  secondImage: 'https://example.com/second.jpg',
  detailTitle: 'The beginning',
  detailText: 'We met and started a life together.',
  storyPages: [{ title: 'First chapter', text: 'Our first memory.', image: 'https://example.com/page.jpg' }],
  finalImage: 'https://example.com/final.jpg',
  finalMessage: 'I would choose you again.',
  musicUrl: '',
}

test('provides template-based appearance defaults with supported font choices', () => {
  const appearance = createDefaultStoryAppearance('midnight-cinema')
  assert.equal(appearance.backgroundColor, '#18151d')
  assert.equal(appearance.accentColor, '#d2a7ff')
  assert.equal(appearance.displayFont, 'instrument-serif')
  assert.equal(appearance.bodyFont, 'space-grotesk')
  assert.equal(storyAppearanceSchema.safeParse(appearance).success, true)
  assert.equal(storyAppearanceSchema.safeParse({ ...appearance, bodyFont: 'unknown-font' }).success, false)

  const css = getStoryAppearanceCssVariables(appearance)
  assert.equal(css['--story-background-color'], '#18151d')
  assert.equal(css['--story-font-body'], "'Space Grotesk', sans-serif")
})

test('uses ornaments only on sections that already have template decorations', () => {
  assert.equal(createDefaultStorySectionDesign('gallery').ornament.enabled, true)
  assert.equal(createDefaultStorySectionDesign('timeline').ornament.enabled, false)
  assert.equal(storySectionDesignSchema.safeParse({
    background: { type: 'video', url: '' },
    ornament: { enabled: true, x: 50, y: 50, scale: 100 },
  }).success, true)
  assert.equal(storySectionDesignSchema.safeParse({
    background: { type: 'color', color: 'rgb(0, 0, 0)' },
    ornament: { enabled: true, x: 101, y: 50, scale: 100 },
  }).success, false)
})

test('requires HTTPS URLs for active custom image and video backgrounds on publish', () => {
  const hero = createDefaultSectionConfig('hero', 0)
  const unsafeImage = storyContentSchema.safeParse({
    ...story,
    sectionLayout: [{
      ...hero,
      design: {
        ...createDefaultStorySectionDesign('hero'),
        background: { type: 'image', url: 'http://example.com/background.jpg' },
      },
    }],
  })
  const incompleteVideo = storyContentSchema.safeParse({
    ...story,
    sectionLayout: [{
      ...hero,
      design: {
        ...createDefaultStorySectionDesign('hero'),
        background: { type: 'video', url: '' },
      },
    }],
  })

  assert.equal(unsafeImage.success, false)
  assert.equal(incompleteVideo.success, false)
  assert.equal(storyContentSchema.safeParse({
    ...story,
    sectionLayout: [{
      ...hero,
      design: {
        ...createDefaultStorySectionDesign('hero'),
        background: { type: 'video', url: 'https://media.example.com/story.webm' },
      },
    }],
  }).success, true)
})
