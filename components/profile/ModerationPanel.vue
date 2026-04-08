<template>
  <div class="p-4">
    <h3 class="text-lg font-semibold mb-4">{{ $t('moderation.pendingReports') }}</h3>

    <div v-if="loading" class="text-center py-8">
      <UProgress animation="carousel" />
    </div>

    <div v-else-if="reports.length === 0" class="text-center text-gray-400 py-8">
      {{ $t('moderation.noReports') }}
    </div>

    <div v-else class="space-y-4">
      <UCard v-for="report in reports" :key="report.id">
        <div class="space-y-2">
          <div class="flex items-start justify-between">
            <div>
              <p class="font-medium">
                {{ report.reviews?.profiles?.display_name ?? 'Unknown' }}
              </p>
              <p class="text-sm text-gray-400">
                {{ $t('moderation.reason') }}: {{ report.reason }}
              </p>
            </div>
            <UBadge color="yellow">{{ report.status }}</UBadge>
          </div>

          <p v-if="report.reviews?.comment" class="text-sm bg-gray-800 p-2 rounded">
            {{ report.reviews.comment }}
          </p>

          <div class="flex gap-2">
            <UButton
              color="success"
              size="xs"
              @click="handleApprove(report)"
            >
              {{ $t('moderation.approve') }}
            </UButton>
            <UButton
              color="error"
              size="xs"
              @click="handleDelete(report)"
            >
              {{ $t('moderation.delete') }}
            </UButton>
            <UButton
              color="error"
              variant="outline"
              size="xs"
              @click="handleBan(report)"
            >
              {{ $t('moderation.ban') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Report } from '~/types'

const { userId } = useAuth()
const { fetchPendingReports, approveReview, deleteReview, banUser } = useModeration()
const toast = useToast()
const { t } = useI18n()

const reports = ref<Report[]>([])
const loading = ref(true)

const loadReports = async () => {
  loading.value = true
  reports.value = await fetchPendingReports()
  loading.value = false
}

const handleApprove = async (report: Report) => {
  if (!userId.value || !report.reviews) return
  await approveReview(report.id, report.review_id, userId.value)
  toast.add({ title: t('common.success'), color: 'green' })
  await loadReports()
}

const handleDelete = async (report: Report) => {
  if (!userId.value) return
  await deleteReview(report.id, report.review_id, userId.value)
  toast.add({ title: t('common.success'), color: 'green' })
  await loadReports()
}

const handleBan = async (report: Report) => {
  if (!userId.value || !report.reviews) return
  await banUser(report.reviews.user_id)
  await deleteReview(report.id, report.review_id, userId.value)
  toast.add({ title: t('common.success'), color: 'green' })
  await loadReports()
}

onMounted(() => loadReports())
</script>
