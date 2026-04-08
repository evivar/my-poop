<template>
  <div class="max-w-6xl mx-auto p-4 sm:p-6 overflow-y-auto h-full space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        size="lg"
        to="/"
      />
      <div class="flex-1">
        <h1 class="text-2xl sm:text-3xl font-bold">
          {{ $t('city.titlePrefix') }} {{ city.name }}
        </h1>
        <p class="text-sm text-gray-400">{{ city.country }}</p>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <div class="text-3xl font-bold">{{ stats.total }}</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide">{{ $t('city.stats.total') }}</div>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <div class="text-3xl font-bold text-green-400">{{ stats.free }}</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide">{{ $t('city.stats.free') }}</div>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <div class="text-3xl font-bold text-blue-400">{{ stats.accessible }}</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide">{{ $t('city.stats.accessible') }}</div>
      </UCard>
      <UCard :ui="{ body: 'p-4 sm:p-4' }">
        <div class="text-3xl font-bold text-yellow-400">{{ stats.verified }}</div>
        <div class="text-xs text-gray-400 uppercase tracking-wide">{{ $t('city.stats.verified') }}</div>
      </UCard>
    </div>

    <!-- Map -->
    <div class="rounded-lg overflow-hidden border border-gray-700 h-[55vh] min-h-96">
      <ClientOnly>
        <MapView :initial-center="center" :initial-zoom="13" />
        <template #fallback>
          <div class="flex items-center justify-center h-full bg-gray-900">
            <UProgress animation="carousel" />
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Top rated -->
    <div v-if="topRated.length > 0">
      <h2 class="text-xl font-semibold mb-3">{{ $t('city.topRated') }}</h2>
      <ul class="space-y-2">
        <li
          v-for="(b, i) in topRated"
          :key="b.id"
          class="flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-gray-500 transition-colors"
        >
          <div class="text-2xl font-bold text-gray-500 w-8 text-center">{{ i + 1 }}</div>
          <div class="flex-1 min-w-0">
            <NuxtLink :to="`/bathroom/${b.id}`" class="font-medium hover:text-primary truncate block">
              {{ b.name }}
            </NuxtLink>
            <div class="text-xs text-gray-400 flex items-center gap-2">
              <span>⭐ {{ b.avg_rating.toFixed(1) }}</span>
              <span>·</span>
              <span>{{ b.review_count }} {{ $t('bathroom.reviews').toLowerCase() }}</span>
              <span v-if="b.is_free">· {{ $t('bathroom.free') }}</span>
              <span v-if="b.is_accessible">· ♿</span>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- CTA -->
    <div class="text-center py-4">
      <p class="text-gray-400 mb-3">{{ $t('city.missedCta') }}</p>
      <UButton
        size="lg"
        color="primary"
        icon="i-heroicons-plus"
        @click="handleAdd"
      >
        {{ $t('bathroom.addBathroom') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CITIES, getCityBySlug, getCityCenter } from '~/utils/cities'

const route = useRoute()
const slugParam = route.params.slug as string

const city = getCityBySlug(slugParam)
if (!city) {
  throw createError({
    statusCode: 404,
    statusMessage: `City "${slugParam}" not found`,
    fatal: true,
  })
}

const { fetchBathroomsInBbox } = useBathrooms()
const { openBathroomForm, openLogin } = useAppModals()
const { user } = useAuth()

// SSR fetch: trae todos los baños del bbox de la ciudad. Esto puebla el
// estado global useState('bathrooms') que MapView ya consume — además
// de darnos el array directo para stats y top rated.
const { data: cityBathrooms } = await useAsyncData(
  `city-${slugParam}`,
  () => fetchBathroomsInBbox({
    south: city.bbox[0],
    west: city.bbox[1],
    north: city.bbox[2],
    east: city.bbox[3],
  }),
  { default: () => [] },
)

const center = computed<[number, number]>(() => getCityCenter(city))

const stats = computed(() => {
  const data = cityBathrooms.value ?? []
  return {
    total: data.length,
    free: data.filter(b => b.is_free).length,
    accessible: data.filter(b => b.is_accessible).length,
    verified: data.filter(b => b.user_edited).length,
  }
})

const topRated = computed(() => {
  const data = cityBathrooms.value ?? []
  return [...data]
    .filter(b => b.review_count > 0 && b.avg_rating > 0)
    .sort((a, b) => b.avg_rating - a.avg_rating)
    .slice(0, 5)
})

const handleAdd = () => {
  if (!user.value) {
    openLogin()
    return
  }
  openBathroomForm()
}

useSeoMeta({
  title: () => `Public bathrooms in ${city.name}, ${city.country} — My Poop`,
  description: () => `${stats.value.total} reviewed public toilets in ${city.name}, ${city.country}. Find clean, accessible, free restrooms with real ratings from the community.`,
  ogTitle: () => `Public bathrooms in ${city.name}`,
  ogDescription: () => `${stats.value.total} restrooms with reviews, photos, and accessibility info.`,
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image',
})

// Mantenemos SSR dinámico por defecto. Cuando tengamos sitemap (Fase 12)
// añadiremos las URLs de ciudad a `nitro.prerender.routes` en nuxt.config.ts
// para servirlas estáticas y mejorar SEO/TTFB.
</script>
