<template>
  <form class="space-y-3" @submit.prevent="handleSubmit">
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <span class="text-sm">{{ $t('review.rating') }}</span>
        <ReviewToiletPaperRating v-model="form.rating" />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm">{{ $t('review.cleanliness') }}</span>
        <ReviewToiletPaperRating v-model="form.cleanliness" />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm">{{ $t('review.privacy') }}</span>
        <ReviewToiletPaperRating v-model="form.privacy" />
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm">{{ $t('review.toiletPaperQuality') }}</span>
        <ReviewToiletPaperRating v-model="form.toilet_paper_quality" />
      </div>
    </div>

    <UTextarea
      v-model="form.comment"
      :placeholder="$t('review.commentPlaceholder')"
      :rows="2"
      class="w-full"
    />

    <UiPhotoUploader v-model:files="photos" :max-photos="2" />

    <UButton
      type="submit"
      color="primary"
      size="sm"
      block
      :loading="loading"
      :disabled="!isValid"
    >
      {{ $t('review.submit') }}
    </UButton>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{
  bathroomId: string
}>()

const emit = defineEmits<{
  submitted: []
}>()

const { userId } = useAuth()
const { createReview } = useReviews()
const { uploadPhoto } = usePhotoUpload()
const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const photos = ref<File[]>([])

const form = reactive({
  rating: 0,
  cleanliness: 0,
  privacy: 0,
  toilet_paper_quality: 0,
  comment: '',
})

const isValid = computed(() =>
  form.rating > 0 && form.cleanliness > 0 && form.privacy > 0 && form.toilet_paper_quality > 0,
)

const handleSubmit = async () => {
  if (!userId.value || !isValid.value) return
  loading.value = true
  try {
    const review = await createReview({
      bathroom_id: props.bathroomId,
      user_id: userId.value,
      rating: form.rating,
      cleanliness: form.cleanliness,
      privacy: form.privacy,
      toilet_paper_quality: form.toilet_paper_quality,
      comment: form.comment || undefined,
    })
    for (const file of photos.value) {
      await uploadPhoto(file, { reviewId: review.id })
    }
    toast.add({ title: t('common.success'), color: 'success' })
    form.rating = 0
    form.cleanliness = 0
    form.privacy = 0
    form.toilet_paper_quality = 0
    form.comment = ''
    photos.value = []
    emit('submitted')
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
