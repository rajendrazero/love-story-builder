import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { storyContentSchema } from '../shared/schema/story.ts'
import {
  availableStoryTemplates,
  createTemplateCustomization,
  getTemplateDefinition,
  parseTemplateCustomization,
  storyTemplateSchema,
  storyTemplates,
} from '../shared/story-templates.ts'

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

test('registry includes each existing public template ID exactly once', () => {
  const ids = storyTemplates.map(template => template.id)

  assert.deepEqual(ids, [
    'editorial-rose',
    'midnight-cinema',
    'botanical-journal',
    'love-letter',
    'memory-atlas',
  ])
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(availableStoryTemplates.map(template => template.id), ids)
  assert.ok(storyTemplates.every(template => template.status === 'available'))
  assert.ok(storyTemplates.every(template => template.name && template.description && template.thumbnail))
  assert.ok(storyTemplates.every(template => template.renderer && template.category === 'couple'))
})

test('rejects unknown template IDs and resolves registered definitions', () => {
  assert.equal(storyTemplateSchema.safeParse('not-a-template').success, false)
  assert.equal(getTemplateDefinition('not-a-template'), undefined)
  assert.equal(getTemplateDefinition('memory-atlas')?.renderer, 'MemoryAtlasLayout')
})

test('each template customization schema accepts its own valid defaults', () => {
  for (const template of storyTemplates) {
    const defaults = createTemplateCustomization(template.id)
    const customization = template.customizationKey
      ? defaults[template.customizationKey]
      : {}
    const parsed = parseTemplateCustomization(template.id, customization)

    assert.ok(parsed?.success, `${template.id} defaults should satisfy its schema`)
    assert.equal(template.schema.safeParse(template.defaults).success, true)
  }
})

test('template schemas reject wrong types, oversized values, and unknown fields', () => {
  assert.equal(parseTemplateCustomization('editorial-rose', { dedication: 123 })?.success, false)
  assert.equal(parseTemplateCustomization('editorial-rose', { dedication: 'x'.repeat(181) })?.success, false)
  assert.equal(parseTemplateCustomization('midnight-cinema', { unknown: 'value' })?.success, false)
  assert.equal(parseTemplateCustomization('memory-atlas', { openingQuote: 'not supported' })?.success, false)
  assert.equal(parseTemplateCustomization('not-a-template', {})?.success, undefined)
})

test('story schema rejects unregistered IDs and validates the selected customization branch', () => {
  assert.equal(storyContentSchema.safeParse({ ...story, templateId: 'not-a-template' }).success, false)
  assert.equal(storyContentSchema.safeParse({
    ...story,
    templateId: 'midnight-cinema',
    templateDetails: { midnightCinema: { openingQuote: 42 } },
  }).success, false)
  assert.equal(storyContentSchema.safeParse({
    ...story,
    templateId: 'editorial-rose',
    templateDetails: { editorialRose: { dedication: 'A valid dedication' } },
  }).success, true)
})

test('editor, previews, and public renderer all use the shared registry', () => {
  const editor = readFileSync(new URL('../app/pages/studio.vue', import.meta.url), 'utf8')
  const catalog = readFileSync(new URL('../app/pages/templates.vue', import.meta.url), 'utf8')
  const preview = readFileSync(new URL('../app/pages/preview.vue', import.meta.url), 'utf8')
  const renderer = readFileSync(new URL('../app/components/StoryExperience.vue', import.meta.url), 'utf8')
  const rendererRegistry = readFileSync(new URL('../app/components/story-templates/registry.ts', import.meta.url), 'utf8')

  assert.match(editor, /createTemplateCustomization/)
  assert.match(editor, /getTemplateDefinition/)
  assert.match(catalog, /#shared\/story-templates/)
  assert.match(preview, /#shared\/story-templates/)
  assert.match(renderer, /templateRenderers\[template\?\.renderer/)
  for (const template of storyTemplates) {
    assert.ok(rendererRegistry.includes(template.renderer), `${template.renderer} must be imported`)
  }
})

test('public story schema keeps accepting legacy stories without template metadata', () => {
  assert.equal(storyContentSchema.safeParse(story).success, true)
})
