<template>
  <div>
    <UButton
      v-if="userId"
      icon="i-heroicons-flag"
      variant="ghost"
      size="xs"
      color="neutral"
      :title="$t('review.report')"
      @click="showReport = true"
    />

    <UModal v-model:open="showReport" :title="$t('review.report')" :description="$t('review.report')">
      <template #content>
        <UCard>
          <template #header>
            <h4 class="font-semibold">{{ $t('review.report') }}</h4>
          </template>
          <form class="space-y-4" @submit.prevent="handleReport">
            <UFormField :label="$t('review.reportReason')">
              <UTextarea v-model="reason" class="w-full" required />
            </UFormField>
            <div class="flex gap-2 justify-end">
              <UButton variant="ghost" @click="showReport = false">
                {{ $t('common.cancel') }}
              </UButton>
              <UButton type="submit" color="error" :loading="loading">
                {{ $t('review.reportSubmit') }}
              </UButton>
            </div>
          </form>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  reviewId: string
}>()

const emit = defineEmits<{
  reported: []
}>()

const { userId } = useAuth()
const { reportReview } = useReviews()
const toast = useToast()
const { t } = useI18n()

const showReport = ref(false)
const reason = ref('')
const loading = ref(false)

const handleReport = async () => {
  if (!userId.value) return
  loading.value = true
  try {
    await reportReview(props.reviewId, userId.value, reason.value)
    toast.add({ title: t('common.success'), color: 'success' })
    showReport.value = false
    reason.value = ''
    emit('reported')
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
