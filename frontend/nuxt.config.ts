export default defineNuxtConfig({
  compatibilityDate: '2025-03-04',
  devtools: { enabled: true },

  // Match the reference: prerender HTML, then hydrate the interactive Nuxt app.
  ssr: true,

  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/ui',
    'nuxt-easy-lightbox',
    '@nuxt/image',
  ],

  css: ['~/assets/css/tailwind.css'],

  image: {
    quality: 80,
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  app: {
    head: {
      title: 'VueSmile Dental Clinic',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'VueSmile Dental Clinic in Cordova, Cebu.' },
      ],
    },
  },

  runtimeConfig: {
    // Server-only Craft origin for prerendering CMS content; override with NUXT_CRAFT_API_ORIGIN.
    craftApiOrigin: process.env.DDEV_PROJECT ? 'http://127.0.0.1' : 'https://vuesmiledental.ddev.site',
    public: {
      siteUrl: '',
      apiBase: '',
      // Public GA4 ID, baked into generated HTML via NUXT_PUBLIC_GA_MEASUREMENT_ID.
      // Empty disables Analytics. Local development is excluded by the client plugin.
      gaMeasurementId: '',
    },
  },

  // Keep the reference project's Vite build settings.
  vite: {
    server: {
      proxy: {
        // Preserve Nuxt Content's own /api/_content routes.
        '^/api/(?!_content(?:/|$))': {
          target: process.env.DDEV_PROJECT
            ? 'http://127.0.0.1'
            : 'http://vuesmiledental.ddev.site',
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      minify: false,
      cssMinify: false,
    },
  },

  nitro: {
    minify: true,
    compressPublicAssets: true,
    prerender: {
      routes: ['/'],
    },
  },
})
