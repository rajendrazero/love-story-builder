import type { StoryContent } from './schema/story.ts'
import {
  createEmptyStorySectionContent,
  type StorySectionContent,
} from './story-sections.ts'
import { createTemplateCustomization } from './story-templates.ts'

const firstGalleryExample = { url: '/previews/first-meeting.svg', caption: 'Awal yang sederhana' }
const galleryExamples: readonly StoryContent['gallery'][number][] = [
  firstGalleryExample,
  { url: '/previews/city.svg', caption: 'Hari yang kita rayakan' },
  { url: '/previews/garden.svg', caption: 'Tempat yang terasa seperti rumah' },
]

const firstStoryPageExample = {
  title: 'Hari pertama kita bertemu',
  text: 'Dari obrolan singkat itu, tumbuh cerita yang selalu ingin kita lanjutkan.',
  image: '/previews/first-meeting.svg',
}
const storyPageExamples: readonly StoryContent['storyPages'][number][] = [
  firstStoryPageExample,
  {
    title: 'Perjalanan kecil berdua',
    text: 'Kita menemukan bahagia di tempat-tempat baru dan perjalanan pulang.',
    image: '/previews/journey.svg',
  },
  {
    title: 'Rumah yang kita bangun',
    text: 'Sedikit demi sedikit, setiap hari bersama terasa seperti rumah.',
    image: '/previews/garden.svg',
  },
]

const firstLoveNoteExample = 'Terima kasih sudah menjadi rumah untukku.'
const loveNoteExamples = [
  firstLoveNoteExample,
  'Aku memilihmu, hari ini dan setiap hari.',
  'Hal sederhana terasa istimewa saat bersamamu.',
]

const firstFutureDreamExample = 'Melihat matahari terbit bersama.'
const futureDreamExamples = [
  firstFutureDreamExample,
  'Mengunjungi tempat yang selalu kita ceritakan.',
  'Membuat rumah kecil dengan taman.',
]

function pageExample(index: number): StoryContent['storyPages'][number] {
  return storyPageExamples[index % storyPageExamples.length] ?? firstStoryPageExample
}

function galleryExample(index: number): StoryContent['gallery'][number] {
  return galleryExamples[index % galleryExamples.length] ?? firstGalleryExample
}

function createPreviewPages(story: StoryContent): StoryContent['storyPages'] {
  const pages = story.storyPages
    .filter(page => page.title.trim() || page.text.trim() || page.image.trim())
    .map((page, index) => {
      const sample = pageExample(index)
      return {
        ...page,
        title: page.title.trim() || sample.title,
        text: page.text.trim() || sample.text,
        image: page.image || sample.image,
      }
    })

  for (let index = pages.length; index < 3; index += 1) {
    pages.push({ ...pageExample(index) })
  }

  return pages
}

function createPreviewGallery(story: StoryContent): StoryContent['gallery'] {
  const gallery = story.gallery
    .filter(photo => photo.url.trim() || photo.caption.trim())
    .map((photo, index) => {
      const sample = galleryExample(index)
      return {
        ...photo,
        url: photo.url || sample.url,
        caption: photo.caption.trim() || sample.caption,
      }
    })

  for (let index = gallery.length; index < 3; index += 1) {
    gallery.push({ ...galleryExample(index) })
  }

  return gallery
}

function createPreviewSectionContent(source: StorySectionContent | undefined): StorySectionContent {
  const empty = createEmptyStorySectionContent()
  const content: StorySectionContent = {
    ...empty,
    ...source,
    distanceMap: { ...empty.distanceMap, ...source?.distanceMap },
    countdown: { ...empty.countdown, ...source?.countdown },
    memoryCapsule: { ...empty.memoryCapsule, ...source?.memoryCapsule },
  }

  const loveNotes = (content.loveNotes ?? []).filter(note => note.trim())
  for (let index = loveNotes.length; index < 3; index += 1) {
    loveNotes.push(loveNoteExamples[index] ?? firstLoveNoteExample)
  }
  content.loveNotes = loveNotes

  const futureDreams = (content.futureDreams ?? []).filter(dream => dream.trim())
  for (let index = futureDreams.length; index < 3; index += 1) {
    futureDreams.push(futureDreamExamples[index] ?? firstFutureDreamExample)
  }
  content.futureDreams = futureDreams

  content.distanceMap = {
    ...content.distanceMap,
    origin: content.distanceMap?.origin?.trim() || 'Bandung, Jawa Barat',
    destination: content.distanceMap?.destination?.trim() || 'Yogyakarta',
    note: content.distanceMap?.note?.trim() || 'Sejauh apa pun, kita selalu menemukan jalan pulang.',
  }
  content.countdown = {
    ...content.countdown,
    title: content.countdown?.title?.trim() || 'Hari jadi kita berikutnya',
    targetDate: content.countdown?.targetDate || '2030-06-18',
  }
  content.memoryCapsule = {
    ...content.memoryCapsule,
    title: content.memoryCapsule?.title?.trim() || 'Untuk kita di masa depan',
    unlockDate: content.memoryCapsule?.unlockDate || '2030-02-14',
    message: content.memoryCapsule?.message?.trim()
      || 'Semoga saat membaca ini, kita masih saling memilih dan merayakan hal-hal kecil bersama.',
  }

  return content
}

export function createStorySectionPreviewStory(story: StoryContent): StoryContent {
  const templateId = story.templateId ?? 'editorial-rose'
  return {
    ...story,
    templateId,
    templateDetails: story.templateDetails ?? createTemplateCustomization(templateId),
    title: story.title.trim() || 'Kisah kita, selamanya',
    coupleNames: story.coupleNames.trim() || 'Nara & Arka',
    date: story.date.trim() || 'Sejak hari pertama',
    heroImage: story.heroImage || '/previews/cover.svg',
    greetingImage: story.greetingImage || '/previews/greeting.svg',
    greetingText: story.greetingText.trim() || 'Untuk kamu, rumah yang selalu ingin kutuju.',
    gallery: createPreviewGallery(story),
    secondImage: story.secondImage || '/previews/first-meeting.svg',
    detailTitle: story.detailTitle.trim() || 'Semua berawal dari hari itu',
    detailText: story.detailText.trim() || 'Sebuah momen kecil yang menjadi awal cerita.',
    storyPages: createPreviewPages(story),
    finalImage: story.finalImage || '/previews/finale.svg',
    finalMessage: story.finalMessage.trim() || 'Dan jika memilih lagi, tetap kamu.',
    musicTitle: story.musicTitle?.trim() || 'A Song for Our Story',
    musicArtist: story.musicArtist?.trim() || story.coupleNames.trim() || 'Nara & Arka',
    sectionContent: createPreviewSectionContent(story.sectionContent),
  }
}
