<template>
  <div class="p-4">
    <div v-if="loading" class="text-center py-8">
      <UProgress animation="carousel" />
    </div>
    <div v-else-if="reviews.length === 0" class="text-center text-gray-400 py-8">
      {{ $t('bathroom.noReviews') }}
    </div>
    <div v-else class="space-y-3">
      <div v-for="review in reviews" :key="review.id" class="border border-gray-700 rounded-lg p-3">
        <div class="flex items-start justify-between">
          <div>
            <p class="font-medium text-sm">{{ (review as any).bathrooms?.name ?? 'Unknown' }}</p>
            <p class="text-xs text-gray-400">{{ new Date(review.created_at).toLocaleDateString() }}</p>
          </div>
          <div class="flex items-center gap-2">
            <ReviewToiletPaperRating :model-value="review.rating" readonly size="sm" />
            <UButton
              icon="i-heroicons-trash"
              color="error"
              variant="ghost"
              size="xs"
              :loading="deleting === review.id"
              @click="confirmDelete(review)"
            />
          </div>
        </div>
        <p v-if="review.comment" class="mt-2 text-sm">{{ review.comment }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Review } from '~/types'

const { userId } = useAuth()
const { fetchUserReviews, deleteOwnReview } = useReviews()
const toast = useToast()
const { t } = useI18n()

const reviews = ref<Review[]>([])
const loading = ref(true)
const deleting = ref<string | null>(null)

const loadReviews = async () => {
  if (userId.value) {
    reviews.value = await fetchUserReviews(userId.value)
  }
}

onMounted(async () => {
  await loadReviews()
  loading.value = false
})

const confirmDelete = async (review: Review) => {
  if (!confirm(t('review.confirmDelete'))) return
  deleting.value = review.id
  try {
    await deleteOwnReview(review.id)
    toast.add({ title: t('common.success'), color: 'success' })
    await loadReviews()
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    deleting.value = null
  }
}
</script>
