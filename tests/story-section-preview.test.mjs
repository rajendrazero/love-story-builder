import assert from 'node:assert/strict'
import { test } from 'node:test'
import { storyContentSchema } from '../shared/schema/story.ts'
import { createStorySectionPreviewStory } from '../shared/story-section-preview.ts'

function createEmptyStory() {
  return storyContentSchema.parse({
    sectionLayout: [],
    title: 'Kisah',
    coupleNames: 'Alya & Bima',
    date: '14 Februari',
    heroImage: 'https://example.com/cover.jpg',
    greetingImage: '',
    greetingVideoUrl: '',
    greetingText: '',
    gallery: [],
    secondImage: '',
    detailTitle: '',
    detailText: '',
    storyPages: [],
    finalImage: '',
    finalMessage: '',
    musicUrl: '',
  })
}

test('section preview fills empty collections with at least three examples', () => {
  const preview = createStorySectionPreviewStory(createEmptyStory())

  assert.equal(preview.gallery.length, 3)
  assert.equal(preview.storyPages.length, 3)
  assert.equal(preview.sectionContent?.loveNotes?.length, 3)
  assert.equal(preview.sectionContent?.futureDreams?.length, 3)
  assert.equal(preview.sectionContent?.distanceMap?.origin, 'Bandung, Jawa Barat')
  assert.equal(preview.sectionContent?.countdown?.title, 'Hari jadi kita berikutnya')
  assert.ok(preview.sectionContent?.memoryCapsule?.message)
})

test('section preview keeps entered content and fills only incomplete or missing items', () => {
  const story = createEmptyStory()
  story.gallery = [{ url: 'https://example.com/photo.jpg', caption: 'Hari pertama' }]
  story.storyPages = [{ title: 'Pertemuan', text: 'Kita bertemu di taman.', image: '' }]
  story.sectionContent = {
    loveNotes: ['Aku memilihmu.'],
    distanceMap: { origin: 'Bandung', destination: '', note: '' },
    futureDreams: ['Melihat laut bersama.'],
    countdown: { title: '', targetDate: '' },
    memoryCapsule: { title: 'Untuk nanti', unlockDate: '', message: '' },
  }

  const preview = createStorySectionPreviewStory(story)

  assert.equal(preview.gallery[0]?.url, 'https://example.com/photo.jpg')
  assert.equal(preview.gallery[0]?.caption, 'Hari pertama')
  assert.equal(preview.gallery.length, 3)
  assert.equal(preview.storyPages[0]?.title, 'Pertemuan')
  assert.equal(preview.storyPages[0]?.text, 'Kita bertemu di taman.')
  assert.equal(preview.storyPages[0]?.image, '/previews/first-meeting.svg')
  assert.equal(preview.storyPages.length, 3)
  assert.equal(preview.sectionContent?.loveNotes?.[0], 'Aku memilihmu.')
  assert.equal(preview.sectionContent?.loveNotes?.length, 3)
  assert.equal(preview.sectionContent?.distanceMap?.origin, 'Bandung')
  assert.equal(preview.sectionContent?.distanceMap?.destination, 'Yogyakarta')
  assert.equal(preview.sectionContent?.memoryCapsule?.title, 'Untuk nanti')
  assert.equal(story.storyPages[0]?.image, '')
  assert.equal(story.sectionContent?.loveNotes?.length, 1)
})
