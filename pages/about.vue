<template>
  <div class="max-w-2xl mx-auto p-6">
    <div class="flex items-center gap-3 mb-8">
      <UButton icon="i-heroicons-arrow-left" variant="ghost" size="lg" to="/" />
      <h1 class="text-2xl font-bold">{{ $t('about.title') }}</h1>
    </div>

    <div v-if="locale === 'es'" class="prose prose-invert max-w-none space-y-4">
      <p class="text-lg">
        Hola, soy <strong>Ernesto</strong> — ingeniero de software de España, actualmente viviendo en Kuala Lumpur, Malasia.
      </p>
      <p>
        Llevo años desarrollando aplicaciones web con Vue, Nuxt y TypeScript. Creé My Poop después de cansarme de abrir 3 apps distintas cada vez que necesitaba encontrar un baño público decente mientras viajaba. Google Maps te dice que hay uno, pero no te dice si está limpio, si tiene papel, ni si tienes que pagar.
      </p>
      <p>
        Así que construí la app que me hubiera gustado tener: un mapa de baños públicos con reseñas reales de personas reales. Simple, gratis, sin anuncios, sin tracking.
      </p>
      <p>
        Si encuentras un bug, te falta una funcionalidad o simplemente quieres decir hola, abre un issue en
        <a href="https://github.com/evivar/my-poop" target="_blank" class="text-primary hover:underline">GitHub</a>.
      </p>
      <p class="text-gray-400 text-sm">Hecho con Vue, Nuxt, Supabase, Leaflet y demasiados chistes de baños.</p>
    </div>

    <div v-else class="prose prose-invert max-w-none space-y-4">
      <p class="text-lg">
        Hi, I'm <strong>Ernesto</strong> — a software engineer from Spain, currently based in Kuala Lumpur, Malaysia.
      </p>
      <p>
        I've spent years building web applications with Vue, Nuxt, and TypeScript. I created My Poop after getting tired of opening 3 different apps every time I needed to find a decent public bathroom while traveling. Google Maps tells you there's one nearby, but it doesn't tell you if it's clean, if it has toilet paper, or if you have to pay.
      </p>
      <p>
        So I built the app I wish existed: a public bathroom map with real reviews from real people. Simple, free, no ads, no tracking.
      </p>
      <p>
        Found a bug, missing a feature, or just want to say hi? Open an issue on
        <a href="https://github.com/evivar/my-poop" target="_blank" class="text-primary hover:underline">GitHub</a>.
      </p>
      <p class="text-gray-400 text-sm">Built with Vue, Nuxt, Supabase, Leaflet, and way too many bathroom jokes.</p>
    </div>

  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

useSeoMeta({
  title: 'About — My Poop',
  description: 'About My Poop: a free, open-source public bathroom finder built by Ernesto, a software engineer from Spain based in Kuala Lumpur.',
})
</script>
