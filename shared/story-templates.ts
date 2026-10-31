export const storyTemplates = [
  {
    id: 'editorial-rose',
    name: 'Editorial Rose',
    mood: 'Lembut, editorial, dan romantis',
    description: 'Sampul majalah cinta dengan dedikasi personal, tipografi serif, dan tata letak yang lapang.',
    previewLabel: 'Edisi kenangan',
    layout: 'Majalah cinta',
    highlights: ['Sampul editorial', 'Foto bergaya cetak', 'Dedikasi & tanda tangan'],
    colors: ['#f8e6e3', '#a94d58', '#fffaf5'],
  },
  {
    id: 'midnight-cinema',
    name: 'Midnight Cinema',
    mood: 'Sinematik, gelap, dan intim',
    description: 'Seperti film pendek kalian: kutipan pembuka, suasana malam, dan kredit penutup.',
    previewLabel: 'Satu film tentang kita',
    layout: 'Film pendek',
    highlights: ['Sampul sinematik', 'Galeri seperti film', 'Kutipan & kredit penutup'],
    colors: ['#18151d', '#d2a7ff', '#f2eaf7'],
  },
  {
    id: 'botanical-journal',
    name: 'Botanical Journal',
    mood: 'Hangat, natural, seperti jurnal perjalanan',
    description: 'Jurnal perjalanan yang hangat dengan catatan lapangan dan aksen alam.',
    previewLabel: 'Jurnal perjalanan',
    layout: 'Jurnal perjalanan',
    highlights: ['Foto cetak jurnal', 'Catatan lapangan', 'Halaman bernuansa kertas'],
    colors: ['#e7ebd8', '#53684b', '#fcf8ed'],
  },
  {
    id: 'love-letter',
    name: 'Love Letter',
    mood: 'Intim, hangat, seperti surat tulisan tangan',
    description: 'Kenangan disusun seperti surat cinta: kertas bertekstur, catatan personal, dan foto-foto yang disimpan di antara halaman.',
    previewLabel: 'Surat untuk selamanya',
    layout: 'Surat cinta',
    highlights: ['Pembuka seperti surat', 'Foto bergaya polaroid', 'Buku kenangan bertekstur'],
    colors: ['#f5e8d5', '#995d50', '#342923'],
  },
] as const

export type StoryTemplateId = typeof storyTemplates[number]['id']
