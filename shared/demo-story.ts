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
  heroImage: '/previews/cover.svg',
  greetingImage: '/previews/greeting.svg',
  greetingVideoUrl: '',
  greetingText: 'Untuk kamu,\nyang selalu membuat perjalanan pulang terasa lebih dekat.',
  gallery: [
    { url: '/previews/sunset.svg', caption: 'Sore yang tidak ingin cepat selesai' },
    { url: '/previews/city.svg', caption: 'Kota baru, tangan yang sama' },
    { url: '/previews/garden.svg', caption: 'Tawa kecil di antara banyak cerita' },
  ],
  secondImage: '/previews/journey.svg',
  detailTitle: 'Semua berawal dari hari itu',
  detailText: 'Kita bertemu tanpa rencana, lalu pulang membawa cerita yang sama. Sejak hari itu, hal-hal sederhana terasa punya tempatnya sendiri.',
  storyPages: [
    {
      title: 'Pertemuan yang sederhana',
      text: 'Tidak ada yang istimewa dari sore itu—sampai kamu duduk di seberangku dan waktu terasa berjalan sedikit lebih pelan.',
      image: '/previews/first-meeting.svg',
    },
    {
      title: 'Jalan-jalan tanpa tujuan',
      text: 'Kita tersesat beberapa kali. Anehnya, setiap jalan terasa benar selama kita menjalaninya bersama.',
      image: '/previews/city.svg',
    },
    {
      title: 'Rumah yang kita temukan',
      text: 'Lama-lama aku tahu, rumah bukan selalu sebuah tempat. Kadang, rumah adalah seseorang yang mendengarkan semua ceritamu.',
      image: '/previews/garden.svg',
    },
  ],
  finalImage: '/previews/finale.svg',
  finalMessage: 'Dan jika aku harus memilih lagi,\naku akan tetap memilih berjalan pulang bersamamu.',
  musicUrl: '',
}
