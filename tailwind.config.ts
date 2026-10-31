import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/**/*.{vue,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#201d28',
        paper: '#f7f4ed',
        rose: '#ff7968',
        muted: '#77727d',
        cobalt: '#5045f5',
        lime: '#d8f36a',
        butter: '#ffd66e',
      },
      fontFamily: {
        display: ['Instrument Serif', 'serif'],
        editorial: ['Space Grotesk', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
}
