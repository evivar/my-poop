<template>
  <div class="max-w-2xl mx-auto p-6">
    <div class="flex items-center gap-3 mb-8">
      <UButton icon="i-heroicons-arrow-left" variant="ghost" size="lg" to="/" />
      <h1 class="text-2xl font-bold">{{ $t('about.title') }}</h1>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 mb-2">
      <div class="text-center p-3 rounded-lg border border-gray-700">
        <div class="text-2xl font-bold">25,700+</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide mt-1">{{ $t('about.stats.bathrooms') }}</div>
      </div>
      <div class="text-center p-3 rounded-lg border border-gray-700">
        <div class="text-2xl font-bold">84</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide mt-1">{{ $t('about.stats.cities') }}</div>
      </div>
      <div class="text-center p-3 rounded-lg border border-gray-700">
        <div class="text-2xl font-bold">40+</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide mt-1">{{ $t('about.stats.countries') }}</div>
      </div>
    </div>
    <p class="text-center text-xs text-gray-500 mb-8">{{ $t('about.stats.growing') }}</p>

    <!-- Content EN -->
    <div v-if="locale !== 'es'" class="space-y-6">
      <!-- SOS story -->
      <div class="space-y-3 text-gray-300">
        <p class="text-lg italic text-gray-400">
          Picture this: you're in Kuala Lumpur, it's 35°C, you ate something adventurous at a street market, and you REALLY need to go. You open Google Maps — there's a pin, but is it clean? Is it free? Does it even still exist? Three apps later, you're still clenching.
        </p>
        <p class="text-lg font-semibold text-white">That's why I built My Poop.</p>
      </div>

      <!-- Bio -->
      <div class="space-y-3 text-gray-300">
        <p>
          Hi, I'm <strong class="text-white">Ernesto</strong> — a software engineer from Spain, currently based in Kuala Lumpur, Malaysia. I've spent years building web applications with Vue, Nuxt, and TypeScript.
        </p>
        <p>
          I built My Poop as a solo side project: a public bathroom map with real reviews from real people. Cleanliness, privacy, toilet paper quality — the stuff that actually matters when you need to go. Simple, free, no ads, no tracking.
        </p>
      </div>

      <!-- Tech stack -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Built with</h2>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="tech in techStack" :key="tech" color="neutral" variant="subtle" size="sm">
            {{ tech }}
          </UBadge>
        </div>
      </div>

      <!-- Open source -->
      <div class="p-4 rounded-lg border border-gray-700 space-y-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-simple-icons-github" class="text-lg" />
          <h2 class="font-semibold">Open Source</h2>
        </div>
        <p class="text-sm text-gray-400">
          My Poop is fully open source under the MIT license. Star the repo, report bugs, or contribute — every PR is welcome.
        </p>
        <a
          href="https://github.com/evivar/my-poop"
          target="_blank"
          class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          github.com/evivar/my-poop
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="text-xs" />
        </a>
      </div>
    </div>

    <!-- Content ES -->
    <div v-else class="space-y-6">
      <!-- SOS story -->
      <div class="space-y-3 text-gray-300">
        <p class="text-lg italic text-gray-400">
          Imagina: estás en Kuala Lumpur, hacen 35°C, comiste algo aventurero en un puesto callejero y NECESITAS ir al baño. Abres Google Maps — hay un pin, pero ¿está limpio? ¿Es gratis? ¿Sigue existiendo? Tres apps después, sigues aguantando.
        </p>
        <p class="text-lg font-semibold text-white">Por eso creé My Poop.</p>
      </div>

      <!-- Bio -->
      <div class="space-y-3 text-gray-300">
        <p>
          Hola, soy <strong class="text-white">Ernesto</strong> — ingeniero de software de España, actualmente viviendo en Kuala Lumpur, Malasia. Llevo años desarrollando aplicaciones web con Vue, Nuxt y TypeScript.
        </p>
        <p>
          Construí My Poop como proyecto personal: un mapa de baños públicos con reseñas reales de personas reales. Limpieza, privacidad, calidad del papel — lo que de verdad importa cuando necesitas ir. Simple, gratis, sin anuncios, sin tracking.
        </p>
      </div>

      <!-- Tech stack -->
      <div>
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Construido con</h2>
        <div class="flex flex-wrap gap-2">
          <UBadge v-for="tech in techStack" :key="tech" color="neutral" variant="subtle" size="sm">
            {{ tech }}
          </UBadge>
        </div>
      </div>

      <!-- Open source -->
      <div class="p-4 rounded-lg border border-gray-700 space-y-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-simple-icons-github" class="text-lg" />
          <h2 class="font-semibold">Open Source</h2>
        </div>
        <p class="text-sm text-gray-400">
          My Poop es totalmente open source bajo licencia MIT. Dale una estrella al repo, reporta bugs o contribuye — cada PR es bienvenido.
        </p>
        <a
          href="https://github.com/evivar/my-poop"
          target="_blank"
          class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          github.com/evivar/my-poop
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="text-xs" />
        </a>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

const techStack = [
  'Vue 3',
  'Nuxt 4',
  'TypeScript',
  'Supabase',
  'PostgreSQL',
  'Leaflet',
  'OpenStreetMap',
  'Vercel Edge',
  'PWA',
  'Capacitor Android',
]

useSeoMeta({
  title: () => locale.value === 'es'
    ? 'Acerca de — My Poop'
    : 'About — My Poop',
  description: () => locale.value === 'es'
    ? 'My Poop: buscador gratuito de baños públicos con más de 25.700 baños en 84 ciudades. Creado por Ernesto, ingeniero de software español en Kuala Lumpur.'
    : 'About My Poop: a free, open-source public bathroom finder with 25,700+ bathrooms across 84 cities. Built by Ernesto, a software engineer from Spain based in Kuala Lumpur.',
})
</script>
