<template>
  <div class="space-y-3">
    <!-- Active alerts -->
    <div v-if="activeStatuses.length > 0" class="space-y-1.5">
      <h4 class="text-sm font-semibold text-warning-400">{{ $t('status.activeAlerts') }}</h4>
      <div class="flex flex-wrap gap-1.5">
        <UBadge
          v-for="active in activeStatuses"
          :key="active.status"
          :color="getStatusConfig(active.status).color as any"
          variant="subtle"
          size="sm"
        >
          <UIcon :name="getStatusConfig(active.status).icon" class="w-3.5 h-3.5 mr-1" />
          {{ getStatusLabel(active.status) }} ({{ active.report_count }})
        </UBadge>
      </div>
    </div>

    <!-- Report buttons -->
    <div v-if="userId">
      <h4 class="text-sm font-semibold mb-2">{{ $t('status.title') }}</h4>
      <div class="flex flex-wrap gap-1.5">
        <UButton
          v-for="status in statusTypes"
          :key="status"
          size="xs"
          variant="outline"
          :disabled="reporting"
          @click="handleReport(status)"
        >
          <UIcon :name="getStatusConfig(status).icon" class="w-3.5 h-3.5" />
          {{ getStatusLabel(status) }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BathroomStatusType, ActiveStatus } from '~/types'

const props = defineProps<{
  bathroomId: string
}>()

const emit = defineEmits<{
  updated: []
}>()

const { userId } = useAuth()
const { reportStatus, fetchActiveStatuses, getStatusLabel, getStatusConfig } = useBathroomStatus()
const toast = useToast()
const { t } = useI18n()

const statusTypes: BathroomStatusType[] = ['no_paper', 'dirty', 'closed', 'out_of_order', 'flooded']
const activeStatuses = ref<ActiveStatus[]>([])
const reporting = ref(false)

const loadStatuses = async () => {
  activeStatuses.value = await fetchActiveStatuses(props.bathroomId)
}

const handleReport = async (status: BathroomStatusType) => {
  reporting.value = true
  try {
    await reportStatus(props.bathroomId, status)
    toast.add({ title: t('status.reported'), color: 'success' })
    await loadStatuses()
    emit('updated')
  } catch (e: any) {
    if (e.message === 'already_reported') {
      toast.add({ title: t('status.alreadyReported'), color: 'warning' })
    } else {
      toast.add({ title: t('common.error'), color: 'error' })
    }
  } finally {
    reporting.value = false
  }
}

watch(() => props.bathroomId, () => loadStatuses(), { immediate: true })

defineExpose({ loadStatuses })
</script>
