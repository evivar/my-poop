<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <ReviewToiletPaperRating :model-value="bathroom.avg_rating" readonly show-value />
      <span class="text-sm text-gray-400">({{ bathroom.review_count }})</span>
    </div>

    <div class="space-y-2 text-sm">
      <div class="flex items-center gap-2 flex-wrap">
        <span v-if="distance" class="text-gray-400 text-xs">{{ distance }}</span>
        <UBadge :color="bathroom.is_free ? 'success' : 'warning'" variant="subtle">
          {{ bathroom.is_free ? $t('bathroom.free') : $t('bathroom.paid') }}
        </UBadge>
        <UBadge color="info" variant="subtle">
          {{ $t(`bathroom.types.${bathroom.type}`) }}
        </UBadge>
        <UBadge v-if="bathroom.is_accessible" color="primary" variant="subtle">
          {{ $t('bathroom.accessible') }}
        </UBadge>
      </div>

      <div v-if="bathroom.directions" class="flex items-start gap-2">
        <UIcon name="i-heroicons-arrow-right-circle" class="text-gray-400 mt-0.5" />
        <span>{{ bathroom.directions }}</span>
      </div>

      <div v-if="bathroom.schedule" class="flex items-start gap-2">
        <UIcon name="i-heroicons-clock" class="text-gray-400 mt-0.5" />
        <span>{{ bathroom.schedule }}</span>
      </div>
    </div>

    <div class="space-y-1 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-gray-400">{{ $t('review.cleanliness') }}</span>
        <ReviewToiletPaperRating :model-value="bathroom.avg_cleanliness" readonly />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-gray-400">{{ $t('review.privacy') }}</span>
        <ReviewToiletPaperRating :model-value="bathroom.avg_privacy" readonly />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-gray-400">{{ $t('review.toiletPaperQuality') }}</span>
        <ReviewToiletPaperRating :model-value="bathroom.avg_toilet_paper_quality" readonly />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bathroom } from '~/types'

const props = defineProps<{
  bathroom: Bathroom
}>()

const { coords } = useGeolocation()

const distance = computed(() => {
  if (!coords.value) return null
  const meters = haversineDistance(
    coords.value.lat, coords.value.lng,
    props.bathroom.latitude, props.bathroom.longitude,
  )
  return formatDistance(meters)
})
</script>
