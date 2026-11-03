import terser from '@rollup/plugin-terser'

export default defineNuxtConfig({
  compatibilityDate: '2025-03-01',
  devtools: { enabled: true },
  modules: ['@nuxt/icon'],
  icon: {
    serverBundle: {
      collections: ['lucide'],
    },
    clientBundle: {
      icons: [
        'lucide:arrow-up-right',
        'lucide:check',
        'lucide:chevron-left',
        'lucide:circle-alert',
        'lucide:copy',
        'lucide:ellipsis',
        'lucide:eye',
        'lucide:eye-off',
        'lucide:globe',
        'lucide:image-plus',
        'lucide:info',
        'lucide:lock-keyhole',
        'lucide:log-out',
        'lucide:menu',
        'lucide:pause',
        'lucide:play',
        'lucide:plus',
        'lucide:refresh-cw',
        'lucide:search',
        'lucide:trash',
        'lucide:upload',
        'lucide:x',
      ],
    },
  },
  app: {
    head: {
      title: 'Selamanya — Cerita Cinta Sinematik',
      meta: [
        { name: 'description', content: 'Rangkai kisah cinta kalian menjadi halaman sinematik yang bisa dibagikan.' },
        { name: 'theme-color', content: '#f5f0e9' },
        { property: 'og:site_name', content: 'Selamanya' },
        { property: 'og:title', content: 'Selamanya — Cerita Cinta Sinematik' },
        { property: 'og:description', content: 'Rangkai kisah cinta kalian menjadi halaman sinematik yang bisa dibagikan.' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
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
