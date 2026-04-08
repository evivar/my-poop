<template>
  <UButton
    icon="i-heroicons-exclamation-circle"
    color="error"
    variant="solid"
    size="lg"
    class="rounded-full shadow-lg"
    :title="$t('nearest.findNearest')"
    :loading="finding"
    @click="handleFind"
  />
</template>

<script setup lang="ts">
const emit = defineEmits<{
  found: [{ lat: number; lng: number; bathroomId: string }]
}>()

const { finding, findNearest } = useNearestBathroom()
const { openBathroomDetail } = useAppModals()
const toast = useToast()
const { t } = useI18n()

const handleFind = async () => {
  const result = await findNearest()
  if (!result) {
    toast.add({ title: t('nearest.notFound'), color: 'warning' })
    return
  }
  toast.add({
    title: t('nearest.found', { distance: result.formatted, name: result.bathroom.name }),
    color: 'success',
  })
  emit('found', {
    lat: result.bathroom.latitude,
    lng: result.bathroom.longitude,
    bathroomId: result.bathroom.id,
  })
  openBathroomDetail(result.bathroom)
}
</script>
