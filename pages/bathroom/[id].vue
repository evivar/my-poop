<template>
  <div class="max-w-3xl mx-auto p-6 overflow-y-auto h-full">
    <div v-if="!bathroom" class="text-center py-16 text-gray-400">
      {{ $t('common.notFound') }}
    </div>

    <template v-else>
      <div class="flex items-center gap-3 mb-6">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="lg"
          to="/"
        />
        <h1 class="text-xl font-bold">{{ bathroom.name }}</h1>
        <UBadge
          v-if="bathroom.source === 'osm'"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          {{ $t('bathroom.importedFromOsm') }}
        </UBadge>
      </div>

      <div class="space-y-6">
        <div v-if="bathroomPhotos.length > 0" class="flex gap-2 overflow-x-auto pb-1 reviews-scroll">
          <img
            v-for="photo in bathroomPhotos"
            :key="photo.id"
            :src="getPhotoUrl(photo.storage_path)"
            class="w-28 h-24 object-cover rounded-lg border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer shrink-0"
            @click="lightboxSrc = getPhotoUrl(photo.storage_path)"
          />
        </div>
        <UiPhotoLightbox v-model="lightboxSrc" />

        <BathroomInfo :bathroom="bathroom" />

        <BathroomStatusPanel :bathroom-id="bathroom.id" />

        <div ref="miniMapContainer" class="w-full h-48 rounded-lg border border-gray-700" />

        <USeparator />

        <div>
          <h2 class="font-semibold mb-3">{{ $t('bathroom.reviews') }} ({{ bathroom.review_count }})</h2>

          <div v-if="loadingReviews" class="text-center py-4">
            <UProgress animation="carousel" />
          </div>

          <div v-else-if="reviews.length === 0" class="text-gray-400 text-sm py-4">
            {{ $t('bathroom.noReviews') }}
          </div>

          <div v-else class="space-y-3">
            <ReviewCard
              v-for="review in reviews"
              :key="review.id"
              :review="review"
              @voted="loadReviews"
            />
          </div>
        </div>

        <UButton
          color="primary"
          size="lg"
          block
          icon="i-heroicons-map"
          :to="{ path: '/', query: { lat: bathroom.latitude, lng: bathroom.longitude, zoom: 18 } }"
        >
          {{ $t('bathroom.openInMap') }}
        </UButton>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { Review, Photo } from '~/types'

const route = useRoute()
const { fetchBathroomById } = useBathrooms()
const { fetchReviewsForBathroom } = useReviews()
const { fetchUserVotes } = useReviewVotes()
const { getPhotoUrl, fetchPhotosForBathroom } = usePhotoUpload()

const { data: bathroom } = await useAsyncData(
  `bathroom-${route.params.id}`,
  () => fetchBathroomById(route.params.id as string),
)

useSeoMeta({
  title: () => bathroom.value ? `${bathroom.value.name} — My Poop` : 'Bathroom — My Poop',
  ogTitle: () => bathroom.value?.name ?? 'Bathroom',
  description: () => bathroom.value
    ? `${bathroom.value.name} — Rated ${bathroom.value.avg_rating.toFixed(1)}/5. ${bathroom.value.review_count} reviews. ${bathroom.value.is_free ? 'Free' : 'Paid'} ${bathroom.value.type} restroom.`
    : 'Find and review public bathrooms near you.',
  ogDescription: () => bathroom.value
    ? `Rated ${bathroom.value.avg_rating.toFixed(1)}/5 with ${bathroom.value.review_count} reviews.`
    : '',
  ogImage: '/og-image.png',
  twitterCard: 'summary',
})

const reviews = ref<Review[]>([])
const bathroomPhotos = ref<Photo[]>([])
const lightboxSrc = ref<string | null>(null)
const loadingReviews = ref(true)
const miniMapContainer = ref<HTMLElement | null>(null)

const loadReviews = async () => {
  if (!bathroom.value) return
  const fetched = await fetchReviewsForBathroom(bathroom.value.id)
  const votedIds = await fetchUserVotes(fetched.map(r => r.id))
  reviews.value = fetched.map(r => ({ ...r, user_has_voted: votedIds.has(r.id) }))
}

onMounted(async () => {
  if (bathroom.value) {
    await loadReviews()
    bathroomPhotos.value = await fetchPhotosForBathroom(bathroom.value.id)
    loadingReviews.value = false
    await initMiniMap()
  }
})

const initMiniMap = async () => {
  if (!miniMapContainer.value || !bathroom.value) return

  const leafletModule = await import('leaflet')
  const L = leafletModule.default || leafletModule

  const { latitude, longitude } = bathroom.value

  const map = L.map(miniMapContainer.value, {
    center: [latitude, longitude],
    zoom: 16,
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    touchZoom: false,
    attributionControl: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  L.marker([latitude, longitude], {
    icon: L.icon({
      iconUrl: '/markers/bathroom-marker.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    }),
  }).addTo(map)
}
</script>
