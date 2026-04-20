<template>
  <div class="border border-gray-700 rounded-lg p-3 space-y-2">
    <div class="flex items-start justify-between">
      <div>
        <p class="font-medium text-sm">{{ review.profiles?.display_name ?? 'Anonymous' }}</p>
        <p class="text-xs text-gray-400">{{ formattedDate }}</p>
      </div>
      <ReviewReportButton :review-id="review.id" @reported="$emit('reported')" />
    </div>
    <ReviewToiletPaperRating :model-value="review.rating" readonly size="sm" />
    <div class="space-y-0.5 text-xs text-gray-400">
      <div>
        <span>{{ $t('review.cleanliness') }}: </span>
        <span>{{ review.cleanliness }}/5</span>
      </div>
      <div>
        <span>{{ $t('review.privacy') }}: </span>
        <span>{{ review.privacy }}/5</span>
      </div>
      <div>
        <span>{{ $t('review.toiletPaperQuality') }}: </span>
        <span>{{ review.toilet_paper_quality }}/5</span>
      </div>
    </div>
    <p v-if="review.comment" class="text-sm">{{ review.comment }}</p>
    <div v-if="review.photos && review.photos.length > 0" class="flex gap-1.5 flex-wrap">
      <img
        v-for="photo in review.photos"
        :key="photo.id"
        :src="getPhotoUrl(photo.storage_path)"
        alt="Review photo"
        loading="lazy"
        class="w-16 h-16 object-cover rounded border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer"
        @click="lightboxSrc = getPhotoUrl(photo.storage_path)"
      />
    </div>
    <div class="flex items-center gap-1 pt-1">
      <button
        :disabled="!user"
        :title="user ? $t('review.helpful') : $t('review.loginToVote')"
        class="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors"
        :class="review.user_has_voted
          ? 'text-primary-400 bg-primary-900/30'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'"
        @click="handleVote"
      >
        <UIcon
          :name="review.user_has_voted ? 'i-heroicons-hand-thumb-up-solid' : 'i-heroicons-hand-thumb-up'"
          class="w-3.5 h-3.5"
        />
        <span v-if="review.vote_count > 0">{{ review.vote_count }}</span>
      </button>
    </div>
    <UiPhotoLightbox v-model="lightboxSrc" />
  </div>
</template>

<script setup lang="ts">
import type { Review } from '~/types'

const props = defineProps<{
  review: Review
}>()

const emit = defineEmits<{
  reported: []
  voted: []
}>()

const user = useSupabaseUser()
const { getPhotoUrl } = usePhotoUpload()
const { toggleVote } = useReviewVotes()
const lightboxSrc = ref<string | null>(null)
const voting = ref(false)

const formattedDate = computed(() => {
  return new Date(props.review.created_at).toLocaleDateString()
})

const handleVote = async () => {
  if (!user.value || voting.value) return
  voting.value = true
  try {
    await toggleVote(props.review.id)
    emit('voted')
  } finally {
    voting.value = false
  }
}
</script>
