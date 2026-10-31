import type { StoryContent } from '#shared/schema/story'

export const demoStory: StoryContent = {
  templateId: 'editorial-rose',
  cursorPreset: 'system',
  templateDetails: {
    editorialRose: { dedication: 'Edisi khusus untuk dua hati', signature: 'Dengan cinta, selalu' },
    midnightCinema: { openingQuote: 'Setiap kisah punya satu adegan yang ingin diulang.', credits: 'Dibintangi Nara & Arka · 2021—selamanya' },
    botanicalJournal: { journalLabel: 'Catatan perjalanan no. 01', fieldNote: 'Bahagia tumbuh dari hal-hal kecil yang dirawat bersama.' },
  },
  title: 'Hal-hal kecil yang jadi selamanya',
  coupleNames: 'Nara & Arka',
  date: 'Sejak 12 Juni 2021',
  heroImage: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=2400&q=85',
  greetingImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85',
  greetingVideoUrl: '',
  greetingText: 'Untuk kamu,\nyang selalu membuat perjalanan pulang terasa lebih dekat.',
  gallery: [
    { url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=85', caption: 'Sore yang tidak ingin cepat selesai' },
    { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=85', caption: 'Kota baru, tangan yang sama' },
    { url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1200&q=85', caption: 'Tawa kecil di antara banyak cerita' },
  ],
  secondImage: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1600&q=85',
  detailTitle: 'Semua berawal dari hari itu',
  detailText: 'Kita bertemu tanpa rencana, lalu pulang membawa cerita yang sama. Sejak hari itu, hal-hal sederhana terasa punya tempatnya sendiri.',
  storyPages: [
    {
      title: 'Pertemuan yang sederhana',
      text: 'Tidak ada yang istimewa dari sore itu—sampai kamu duduk di seberangku dan waktu terasa berjalan sedikit lebih pelan.',
      image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?auto=format&fit=crop&w=1200&q=85',
    },
    {
      title: 'Jalan-jalan tanpa tujuan',
      text: 'Kita tersesat beberapa kali. Anehnya, setiap jalan terasa benar selama kita menjalaninya bersama.',
      image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=85',
    },
    {
      title: 'Rumah yang kita temukan',
      text: 'Lama-lama aku tahu, rumah bukan selalu sebuah tempat. Kadang, rumah adalah seseorang yang mendengarkan semua ceritamu.',
      image: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1200&q=85',
    },
  ],
  finalImage: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=2000&q=85',
  finalMessage: 'Dan jika aku harus memilih lagi,\naku akan tetap memilih berjalan pulang bersamamu.',
  musicUrl: '',
}
