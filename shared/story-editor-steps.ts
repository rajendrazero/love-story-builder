import { sortStorySections, type StorySectionConfig, type StorySectionType } from './story-sections.ts'

export type StoryEditorStep = {
  id: string
  title: string
  sectionType?: StorySectionType
}

const sectionTitles: Record<StorySectionType, string> = {
  hero: 'Sampul cerita',
  greeting: 'Kartu ucapan',
  'first-encounter': 'Pertemuan pertama',
  gallery: 'Galeri kenangan',
  'moments-in-motion': 'Momen bergerak',
  music: 'Soundtrack',
  timeline: 'Garis waktu',
  'love-notes': 'Catatan cinta',
  constellation: 'Konstelasi',
  'distance-map': 'Peta perjalanan',
  'future-dreams': 'Rencana bersama',
  countdown: 'Hitung mundur',
  'memory-capsule': 'Kapsul kenangan',
  book: 'Buku cerita',
  finale: 'Penutup',
}

export function createStoryEditorSteps(sections: readonly StorySectionConfig[]): StoryEditorStep[] {
  return [
    { id: 'theme', title: 'Tema' },
    { id: 'cover', title: 'Pembuka' },
    { id: 'sections', title: 'Susunan cerita' },
    ...sortStorySections(sections)
      .filter(section => section.type !== 'hero')
      .map(section => ({
        id: `section:${section.type}`,
        title: sectionTitles[section.type],
        sectionType: section.type,
      })),
    { id: 'settings', title: 'Privasi & akhir' },
  ]
}
