import {
  storyCursorSchema,
  storyTemplateSchema,
  type StoryContent,
} from '#shared/schema/story'
import type { D1Database, D1Statement } from './cloudflare'

interface StoryContentRow {
  template_id: string
  cursor_preset: string
  title: string
  couple_names: string
  date_label: string
  hero_image: string
  greeting_image: string
  greeting_video_url: string
  greeting_text: string
  second_image: string
  detail_title: string
  detail_text: string
  final_image: string
  final_message: string
  music_url: string
}

interface GalleryRow {
  url: string
  caption: string
}

interface ChapterRow {
  title: string
  body: string
  image_url: string
}

interface EditorialDetailsRow {
  dedication: string
  signature: string
}

interface CinemaDetailsRow {
  opening_quote: string
  credits: string
}

interface BotanicalDetailsRow {
  journal_label: string
  field_note: string
}

interface StoryContentInput extends Omit<Partial<StoryContent>, 'gallery' | 'storyPages'> {
  gallery?: Array<{ url?: string, caption?: string }>
  storyPages?: Array<{ title?: string, text?: string, image?: string }>
}

const contentColumns = [
  'template_id',
  'cursor_preset',
  'title',
  'couple_names',
  'date_label',
  'hero_image',
  'greeting_image',
  'greeting_video_url',
  'greeting_text',
  'second_image',
  'detail_title',
  'detail_text',
  'final_image',
  'final_message',
  'music_url',
] as const

export function storyContentStatements(
  database: D1Database,
  id: string,
  content: StoryContentInput,
): D1Statement[] {
  const values = [
    id,
    content.templateId ?? 'editorial-rose',
    content.cursorPreset ?? 'system',
    content.title ?? '',
    content.coupleNames ?? '',
    content.date ?? '',
    content.heroImage ?? '',
    content.greetingImage ?? '',
    content.greetingVideoUrl ?? '',
    content.greetingText ?? '',
    content.secondImage ?? '',
    content.detailTitle ?? '',
    content.detailText ?? '',
    content.finalImage ?? '',
    content.finalMessage ?? '',
    content.musicUrl ?? '',
  ]
  const columns = ['id', ...contentColumns]
  const placeholders = columns.map(() => '?').join(', ')
  const updates = contentColumns.map(column => `${column} = excluded.${column}`).join(', ')
  const statements = [
    database.prepare(
      `INSERT INTO story_content (${columns.join(', ')}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${updates}`,
    ).bind(...values),
    database.prepare('DELETE FROM story_template_editorial WHERE content_id = ?').bind(id),
    database.prepare('DELETE FROM story_template_cinema WHERE content_id = ?').bind(id),
    database.prepare('DELETE FROM story_template_botanical WHERE content_id = ?').bind(id),
    database.prepare('DELETE FROM story_gallery_items WHERE content_id = ?').bind(id),
    database.prepare('DELETE FROM story_chapters WHERE content_id = ?').bind(id),
  ]

  const editorial = content.templateDetails?.editorialRose
  if (editorial) {
    statements.push(database.prepare(
      'INSERT INTO story_template_editorial (content_id, dedication, signature) VALUES (?, ?, ?)',
    ).bind(id, editorial.dedication ?? '', editorial.signature ?? ''))
  }
  const cinema = content.templateDetails?.midnightCinema
  if (cinema) {
    statements.push(database.prepare(
      'INSERT INTO story_template_cinema (content_id, opening_quote, credits) VALUES (?, ?, ?)',
    ).bind(id, cinema.openingQuote ?? '', cinema.credits ?? ''))
  }
  const botanical = content.templateDetails?.botanicalJournal
  if (botanical) {
    statements.push(database.prepare(
      'INSERT INTO story_template_botanical (content_id, journal_label, field_note) VALUES (?, ?, ?)',
    ).bind(id, botanical.journalLabel ?? '', botanical.fieldNote ?? ''))
  }

  for (const [position, photo] of (content.gallery ?? []).entries()) {
    statements.push(database.prepare(
      'INSERT INTO story_gallery_items (content_id, position, url, caption) VALUES (?, ?, ?, ?)',
    ).bind(id, position, photo.url ?? '', photo.caption ?? ''))
  }

  for (const [position, chapter] of (content.storyPages ?? []).entries()) {
    statements.push(database.prepare(
      'INSERT INTO story_chapters (content_id, position, title, body, image_url) VALUES (?, ?, ?, ?, ?)',
    ).bind(id, position, chapter.title ?? '', chapter.text ?? '', chapter.image ?? ''))
  }

  return statements
}

export async function saveStoryContent(
  database: D1Database,
  id: string,
  content: StoryContentInput,
): Promise<void> {
  await database.batch(storyContentStatements(database, id, content))
}

export async function getStoryContent(
  database: D1Database,
  id: string,
): Promise<StoryContent | null> {
  const row = await database.prepare(
    `SELECT ${contentColumns.join(', ')} FROM story_content WHERE id = ?`,
  ).bind(id).first<StoryContentRow>()
  if (!row) return null

  const template = storyTemplateSchema.safeParse(row.template_id)
  const cursor = storyCursorSchema.safeParse(row.cursor_preset)
  if (!template.success || !cursor.success) {
    throw new Error(`Story content ${id} has invalid template or cursor data.`)
  }

  const [
    galleryResult,
    chapterResult,
    editorial,
    cinema,
    botanical,
  ] = await Promise.all([
    database.prepare(
      'SELECT url, caption FROM story_gallery_items WHERE content_id = ? ORDER BY position',
    ).bind(id).all<GalleryRow>(),
    database.prepare(
      'SELECT title, body, image_url FROM story_chapters WHERE content_id = ? ORDER BY position',
    ).bind(id).all<ChapterRow>(),
    database.prepare(
      'SELECT dedication, signature FROM story_template_editorial WHERE content_id = ?',
    ).bind(id).first<EditorialDetailsRow>(),
    database.prepare(
      'SELECT opening_quote, credits FROM story_template_cinema WHERE content_id = ?',
    ).bind(id).first<CinemaDetailsRow>(),
    database.prepare(
      'SELECT journal_label, field_note FROM story_template_botanical WHERE content_id = ?',
    ).bind(id).first<BotanicalDetailsRow>(),
  ])

  const templateDetails: NonNullable<StoryContent['templateDetails']> = {}
  if (editorial) {
    templateDetails.editorialRose = {
      dedication: editorial.dedication,
      signature: editorial.signature,
    }
  }
  if (cinema) {
    templateDetails.midnightCinema = {
      openingQuote: cinema.opening_quote,
      credits: cinema.credits,
    }
  }
  if (botanical) {
    templateDetails.botanicalJournal = {
      journalLabel: botanical.journal_label,
      fieldNote: botanical.field_note,
    }
  }

  return {
    templateId: template.data,
    cursorPreset: cursor.data,
    templateDetails,
    title: row.title,
    coupleNames: row.couple_names,
    date: row.date_label,
    heroImage: row.hero_image,
    greetingImage: row.greeting_image,
    greetingVideoUrl: row.greeting_video_url,
    greetingText: row.greeting_text,
    gallery: galleryResult.results,
    secondImage: row.second_image,
    detailTitle: row.detail_title,
    detailText: row.detail_text,
    storyPages: chapterResult.results.map(chapter => ({
      title: chapter.title,
      text: chapter.body,
      image: chapter.image_url,
    })),
    finalImage: row.final_image,
    finalMessage: row.final_message,
    musicUrl: row.music_url,
  }
}
