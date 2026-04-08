<template>
  <div class="p-4">
    <div v-if="loading" class="text-center py-8">
      <UProgress animation="carousel" />
    </div>
    <div v-else-if="bathrooms.length === 0" class="text-center text-gray-400 py-8">
      {{ $t('profile.noFavorites') }}
    </div>
    <div v-else class="space-y-3">
      <div v-for="bathroom in bathrooms" :key="bathroom.id" class="border border-gray-700 rounded-lg p-3">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-sm">{{ bathroom.name }}</p>
            <div class="flex items-center gap-2 mt-1">
              <ReviewToiletPaperRating :model-value="bathroom.avg_rating" readonly size="sm" />
              <span class="text-xs text-gray-400">({{ bathroom.review_count }})</span>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <UButton
              icon="i-heroicons-map-pin"
              color="primary"
              variant="ghost"
              size="xs"
              @click="goToBathroom(bathroom)"
            />
            <UButton
              icon="i-heroicons-heart-solid"
              color="error"
              variant="ghost"
              size="xs"
              :loading="removing === bathroom.id"
              @click="removeFavorite(bathroom)"
            />
          </div>
        </div>
        <div class="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <UBadge :color="bathroom.is_free ? 'success' : 'warning'" variant="subtle" size="xs">
            {{ bathroom.is_free ? $t('bathroom.free') : $t('bathroom.paid') }}
          </UBadge>
          <UBadge color="info" variant="subtle" size="xs">
            {{ $t(`bathroom.types.${bathroom.type}`) }}
          </UBadge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bathroom } from '~/types'

const { fetchFavoriteBathrooms, toggleFavorite } = useFavorites()
const router = useRouter()

const bathrooms = ref<Bathroom[]>([])
const loading = ref(true)
const removing = ref<string | null>(null)

onMounted(async () => {
  bathrooms.value = await fetchFavoriteBathrooms()
  loading.value = false
})

const goToBathroom = (bathroom: Bathroom) => {
  router.push({ path: '/', query: { lat: String(bathroom.latitude), lng: String(bathroom.longitude), zoom: '18' } })
}

const removeFavorite = async (bathroom: Bathroom) => {
  removing.value = bathroom.id
  await toggleFavorite(bathroom.id)
  bathrooms.value = bathrooms.value.filter(b => b.id !== bathroom.id)
  removing.value = null
}
</script>
