<template>
  <UModal v-model:open="bathroomDetailOpen" :ui="{ content: 'max-w-7xl' }" title="Bathroom Details" description="Bathroom details and reviews">
    <template #content>
      <div v-if="selectedBathroom" class="max-h-[85vh] overflow-y-auto">
        <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UButton
                v-if="showReviewForm"
                icon="i-heroicons-arrow-left"
                variant="ghost"
                size="sm"
                @click="showReviewForm = false"
              />
              <h3 class="text-lg font-semibold">
                {{ showReviewForm ? $t('review.leaveReview') : selectedBathroom.name }}
              </h3>
              <UBadge
                v-if="!showReviewForm && selectedBathroom.source === 'osm'"
                color="neutral"
                variant="subtle"
                size="xs"
              >
                {{ $t('bathroom.importedFromOsm') }}
              </UBadge>
              <UBadge
                v-if="!showReviewForm && selectedBathroom.source === 'osm' && selectedBathroom.user_edited"
                color="success"
                variant="subtle"
                size="xs"
              >
                {{ $t('bathroom.verified') }}
              </UBadge>
              <UButton
                v-if="userId && !showReviewForm"
                :icon="isFav ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                :color="isFav ? 'error' : 'neutral'"
                variant="ghost"
                size="sm"
                @click="handleToggleFavorite"
              />
            </div>
            <div class="flex items-center gap-1">
              <template v-if="!showReviewForm">
                <UButton
                  v-if="userId && selectedBathroom.source === 'osm'"
                  icon="i-heroicons-pencil"
                  variant="ghost"
                  size="sm"
                  :title="$t('bathroom.edit')"
                  @click="handleEdit"
                />
                <UButton
                  icon="i-heroicons-arrow-up-right"
                  variant="ghost"
                  size="sm"
                  class="hidden sm:inline-flex"
                  :title="$t('bathroom.openInMap')"
                  @click="openInNewTab"
                />
                <UButton
                  icon="i-heroicons-share"
                  variant="ghost"
                  size="sm"
                  :title="$t('bathroom.share')"
                  @click="shareBathroom"
                />
              </template>
              <UButton icon="i-heroicons-x-mark" variant="ghost" @click="bathroomDetailOpen = false" />
            </div>
          </div>

          <p
            v-if="!showReviewForm && selectedBathroom.source === 'osm' && !selectedBathroom.user_edited"
            class="text-xs text-gray-400 mt-1"
          >
            {{ $t('bathroom.helpImproveOsm') }}
          </p>

          <div v-if="!showReviewForm && (bathroomPhotos.length > 0 || userId)" class="mt-3">
            <div v-if="bathroomPhotos.length > 0" class="flex gap-2 overflow-x-auto pb-1 reviews-scroll">
              <img
                v-for="photo in bathroomPhotos"
                :key="photo.id"
                :src="getPhotoUrl(photo.storage_path)"
                :alt="`Photo of ${selectedBathroom.name}`"
                loading="lazy"
                class="w-24 h-20 object-cover rounded-lg border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer shrink-0"
                @click="lightboxSrc = getPhotoUrl(photo.storage_path)"
              />
            </div>
            <div v-else class="flex items-center justify-center h-20 border border-dashed border-gray-700 rounded-lg text-gray-500 text-sm">
              <UIcon name="i-heroicons-camera" class="mr-1" />
              {{ $t('photos.noPhotos') }}
            </div>
            <div v-if="userId && directPhotoCount < 5" class="mt-2">
              <button
                v-if="isNative"
                type="button"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-xs text-gray-400"
                @click="onAddBathroomPhotoNative"
              >
                <UIcon name="i-heroicons-camera" />
                <span>{{ $t('photos.addPhoto') }}</span>
              </button>
              <label
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-xs text-gray-400"
              >
                <UIcon name="i-heroicons-camera" />
                <span>{{ $t('photos.addPhoto') }}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  class="hidden"
                  @change="onAddBathroomPhoto"
                />
              </label>
            </div>
          </div>
        </template>

        <!-- Review form view -->
        <div v-if="showReviewForm">
          <ReviewForm :bathroom-id="selectedBathroom.id" @submitted="onReviewSubmitted" />
        </div>

        <!-- Detail view -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <BathroomInfo :bathroom="selectedBathroom" />

            <UButton
              icon="i-heroicons-map"
              color="primary"
              variant="soft"
              block
              @click="openDirections"
            >
              {{ $t('bathroom.getDirections') }}
            </UButton>
            <UButton
              v-if="user && !hasUserReviewed"
              icon="i-heroicons-pencil-square"
              color="primary"
              variant="outline"
              block
              @click="showReviewForm = true"
            >
              {{ $t('review.leaveReview') }}
            </UButton>
            <p v-else-if="hasUserReviewed" class="text-sm text-gray-400">
              {{ $t('review.alreadyReviewed') }}
            </p>
            <p v-else class="text-sm text-gray-400">
              {{ $t('review.loginToReview') }}
            </p>

            <BathroomStatusPanel :bathroom-id="selectedBathroom.id" />
          </div>

          <div class="space-y-3">
            <h4 class="font-semibold">{{ $t('bathroom.reviews') }} ({{ selectedBathroom.review_count }})</h4>

            <div v-if="loadingReviews" class="text-center py-4">
              <UProgress animation="carousel" />
            </div>

            <div v-else-if="reviews.length === 0" class="text-gray-400 text-sm py-4">
              {{ $t('bathroom.noReviews') }}
            </div>

            <div v-else class="space-y-3 md:max-h-112 md:overflow-y-auto md:pr-1 reviews-scroll">
              <ReviewCard
                v-for="review in reviews"
                :key="review.id"
                :review="review"
                @reported="loadReviews"
                @voted="loadReviews"
              />
            </div>
          </div>
        </div>
      </UCard>
      </div>
      <UiPhotoLightbox v-model="lightboxSrc" />
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Review, Photo } from '~/types'

const { user, userId } = useAuth()
const { fetchReviewsForBathroom } = useReviews()
const { fetchUserVotes } = useReviewVotes()
const { refreshBathroom } = useBathrooms()
const { toggleFavorite, isFavorite } = useFavorites()
const { validateImage, uploadPhoto, getPhotoUrl, fetchPhotosForBathroom, fetchDirectBathroomPhotoCount } = usePhotoUpload()
const { isNative, pickWithPrompt } = usePhotoCapture()
const { share } = useShare()
const { bathroomDetailOpen, selectedBathroom, openBathroomForm } = useAppModals()
const toast = useToast()
const { t } = useI18n()

const isFav = computed(() => selectedBathroom.value ? isFavorite(selectedBathroom.value.id) : false)

const handleToggleFavorite = async () => {
  if (!selectedBathroom.value) return
  await toggleFavorite(selectedBathroom.value.id)
}

const handleEdit = () => {
  if (!selectedBathroom.value) return
  // Cierra este modal y abre el form en modo edit con el baño actual
  bathroomDetailOpen.value = false
  openBathroomForm(selectedBathroom.value)
}

const bathroomUrl = computed(() => {
  if (!selectedBathroom.value) return ''
  return `${getAppUrl()}/bathroom/${selectedBathroom.value.id}`
})

const openDirections = () => {
  if (!selectedBathroom.value) return
  const { latitude, longitude } = selectedBathroom.value
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document
  const url = isApple
    ? `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`
  window.open(url, '_blank')
}

const openInNewTab = () => {
  window.open(bathroomUrl.value, '_blank')
}

const shareBathroom = async () => {
  if (!selectedBathroom.value) return
  const text = `${selectedBathroom.value.name} — ${(selectedBathroom.value.avg_rating ?? 0).toFixed(1)}/5 🧻`
  try {
    const result = await share({
      title: selectedBathroom.value.name,
      text,
      url: bathroomUrl.value,
      dialogTitle: selectedBathroom.value.name,
    })
    if (result === 'copied') {
      toast.add({ title: t('bathroom.linkCopied'), color: 'success' })
    }
  } catch {
    // Real share error — ignore silently to avoid noisy UI
  }
}

const reviews = ref<Review[]>([])
const loadingReviews = ref(false)
const showReviewForm = ref(false)
const bathroomPhotos = ref<Photo[]>([])
const directPhotoCount = ref(0)
const lightboxSrc = ref<string | null>(null)

const hasUserReviewed = computed(() => {
  if (!userId.value) return false
  return reviews.value.some(r => r.user_id === userId.value)
})

const loadReviews = async () => {
  if (!selectedBathroom.value) return
  loadingReviews.value = true
  const fetched = await fetchReviewsForBathroom(selectedBathroom.value.id)
  const votedIds = await fetchUserVotes(fetched.map(r => r.id))
  reviews.value = fetched.map(r => ({ ...r, user_has_voted: votedIds.has(r.id) }))
  loadingReviews.value = false
}

const loadPhotos = async () => {
  if (!selectedBathroom.value) return
  bathroomPhotos.value = await fetchPhotosForBathroom(selectedBathroom.value.id)
  directPhotoCount.value = await fetchDirectBathroomPhotoCount(selectedBathroom.value.id)
}

const processAndUploadBathroomPhoto = async (file: File): Promise<boolean> => {
  if (!selectedBathroom.value) return false
  if (directPhotoCount.value >= 5) {
    toast.add({ title: t('photos.maxReached'), color: 'error' })
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: t('photos.tooLarge'), color: 'error' })
    return false
  }
  const isValid = await validateImage(file)
  if (!isValid) {
    toast.add({ title: t('photos.rejected'), color: 'error' })
    return false
  }
  await uploadPhoto(file, { bathroomId: selectedBathroom.value.id })
  toast.add({ title: t('common.success'), color: 'success' })
  await loadPhotos()
  return true
}

const onAddBathroomPhoto = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return
  await processAndUploadBathroomPhoto(input.files[0])
  input.value = ''
}

const onAddBathroomPhotoNative = async () => {
  try {
    const file = await pickWithPrompt()
    if (!file) return
    await processAndUploadBathroomPhoto(file)
  }
  catch {
    toast.add({ title: t('photos.cameraError'), color: 'error' })
  }
}

const onReviewSubmitted = async () => {
  showReviewForm.value = false
  await loadReviews()
  await loadPhotos()
  if (selectedBathroom.value?.id) {
    await refreshBathroom(selectedBathroom.value.id)
  }
}

watch(bathroomDetailOpen, (open) => {
  if (open) {
    loadReviews()
    loadPhotos()
  } else {
    bathroomPhotos.value = []
    showReviewForm.value = false
  }
})
</script>
