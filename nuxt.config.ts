import terser from '@rollup/plugin-terser'

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
    public: {
      turnstileSiteKey: '',
    },
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
    routeRules: {
      '/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        },
      },
    },
  },
  hooks: {
    'nitro:init'(nitro) {
      nitro.hooks.hook('rollup:before', (_nitro, rollupConfig) => {
        if (_nitro.options.dev) return

        const plugins = rollupConfig.plugins

        if (!plugins) {
          throw new Error('Nitro Rollup plugins were not initialized before minification.')
        }

        const pluginIndex = plugins.findIndex(
          plugin => typeof plugin === 'object'
            && plugin !== null
            && 'name' in plugin
            && plugin.name === 'terser',
        ) ?? -1

        if (pluginIndex < 0) {
          throw new Error('Nitro Terser plugin was not found; refusing to build without a worker limit.')
        }

        plugins[pluginIndex] = terser({
          maxWorkers: 2,
          mangle: {
            keep_fnames: true,
            keep_classnames: true,
          },
          format: {
            comments: false,
          },
        })
      })
    },
  },
  typescript: {
    strict: true,
  },
})
