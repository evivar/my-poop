// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: 'My Poop — Find & Review Public Bathrooms',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Discover, rate and review public bathrooms near you. Find clean restrooms with real user ratings on cleanliness, privacy and toilet paper quality.' },
        { name: 'theme-color', content: '#111827' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'My Poop — Find & Review Public Bathrooms' },
        { property: 'og:description', content: 'Discover, rate and review public bathrooms near you. Real ratings from real people.' },
        { property: 'og:image', content: '/og-image.png' },
        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'My Poop — Find & Review Public Bathrooms' },
        { name: 'twitter:description', content: 'Discover, rate and review public bathrooms near you. Real ratings from real people.' },
        { name: 'twitter:image', content: '/og-image.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@vercel/analytics/nuxt',
  ],

  pwa: {
    registerType: 'autoUpdate',
    // Desactivar en dev: el service worker cachea muy agresivo y rompe HMR.
    // Probarlo con `npm run build && npm run preview`.
    disable: process.env.NODE_ENV === 'development',
    manifest: {
      name: 'My Poop — Find Public Bathrooms',
      short_name: 'My Poop',
      description: 'Discover, rate and review public bathrooms near you.',
      theme_color: '#111827',
      background_color: '#111827',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
        // Reusamos el 512 como maskable. Si Android crop el icono, regenerar
        // un PNG dedicado con safe zone (10% padding) vía https://maskable.app
        { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      // Cachear assets estáticos. Los HTML/JS/CSS/imagen del build entran al
      // service worker para que la app funcione offline / fast-load.
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
      // Subimos el cap a 6 MB porque nsfwjs/TensorFlow tiene chunks grandes.
      // TODO(perf): hacer lazy-load de TF.js sólo cuando el usuario sube
      // foto, así estos chunks no entrarían al precache de inicio.
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
    },
    devOptions: {
      enabled: false,
    },
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  supabase: {
    redirectOptions: {
      login: '/',
      callback: '/confirm',
      include: undefined,
      // Rutas públicas (SEO/landing) que no deben redirigir al login
      exclude: ['/city/**', '/bathroom/**', '/about', '/privacy'],
      cookieRedirect: false,
    },
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
    ],
    lazy: true,
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue-leaflet/vue-leaflet',
        'leaflet',
        'leaflet.markercluster',
      ],
    },
    server: {
      watch: {
        ignored: ['**/.playwright-mcp/**'],
      },
    },
  },

  ssr: process.env.CAPACITOR !== 'true',

  compatibilityDate: '2026-03-27',
})
