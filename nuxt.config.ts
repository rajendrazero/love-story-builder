export default defineNuxtConfig({
  compatibilityDate: '2025-03-01',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Selamanya — Cerita Cinta Sinematik',
      meta: [
        { name: 'description', content: 'Rangkai kisah cinta kalian menjadi halaman sinematik yang bisa dibagikan.' },
        { name: 'theme-color', content: '#f5f0e9' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
  typescript: {
    strict: true,
  },
})
