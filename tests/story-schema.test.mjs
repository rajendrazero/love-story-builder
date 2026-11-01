import assert from 'node:assert/strict'
import { test } from 'node:test'
import { storyContentSchema } from '../shared/schema/story.ts'

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

test('accepts each template-specific set of copy and safe cursor presets', () => {
  const templateOptions = [
    {
      templateId: 'editorial-rose',
      templateDetails: { editorialRose: { dedication: 'A special edition', signature: 'With love' } },
      cursorPreset: 'heart',
    },
    {
      templateId: 'midnight-cinema',
      templateDetails: { midnightCinema: { openingQuote: 'A line from our film', credits: 'Starring us' } },
      cursorPreset: 'sparkle',
    },
    {
      templateId: 'botanical-journal',
      templateDetails: { botanicalJournal: { journalLabel: 'Field notes', fieldNote: 'Growing together' } },
      cursorPreset: 'flower',
    },
    {
      templateId: 'love-letter',
      templateDetails: { editorialRose: { dedication: 'For you, always', signature: 'With love' } },
      cursorPreset: 'heart',
    },
    {
      templateId: 'memory-atlas',
      cursorPreset: 'star',
    },
    {
      templateId: 'editorial-rose',
      cursorPreset: 'system',
    },
  ]

  for (const options of templateOptions) {
    assert.equal(storyContentSchema.safeParse({ ...story, ...options }).success, true)
  }
})

test('rejects arbitrary cursor values and oversized template copy', () => {
  assert.equal(storyContentSchema.safeParse({ ...story, cursorPreset: 'url(https://attacker.example)' }).success, false)
  assert.equal(storyContentSchema.safeParse({
    ...story,
    templateId: 'editorial-rose',
    templateDetails: { editorialRose: { dedication: 'x'.repeat(181) } },
  }).success, false)
})

test('continues to accept older published stories without optional template settings', () => {
  assert.equal(storyContentSchema.safeParse(story).success, true)
})
