export const storyTemplates = [
  {
    id: 'editorial-rose',
    name: 'Editorial Rose',
    mood: 'Lembut, editorial, dan romantis',
    description: 'Sampul majalah cinta dengan dedikasi personal, tipografi serif, dan tata letak yang lapang.',
    previewLabel: 'Edisi kenangan',
    colors: ['#f8e6e3', '#a94d58', '#fffaf5'],
  },
  {
    id: 'midnight-cinema',
    name: 'Midnight Cinema',
    mood: 'Sinematik, gelap, dan intim',
    description: 'Seperti film pendek kalian: kutipan pembuka, suasana malam, dan kredit penutup.',
    previewLabel: 'Satu film tentang kita',
    colors: ['#18151d', '#d2a7ff', '#f2eaf7'],
  },
  {
    id: 'botanical-journal',
    name: 'Botanical Journal',
    mood: 'Hangat, natural, seperti jurnal perjalanan',
    description: 'Jurnal perjalanan yang hangat dengan catatan lapangan dan aksen alam.',
    previewLabel: 'Jurnal perjalanan',
    colors: ['#e7ebd8', '#53684b', '#fcf8ed'],
  },
] as const

export type StoryTemplateId = typeof storyTemplates[number]['id']
