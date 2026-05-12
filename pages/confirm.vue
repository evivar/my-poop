<template>
  <div class="flex items-center justify-center h-full">
    <UCard>
      <div class="text-center p-4 max-w-sm">
        <template v-if="!hasError">
          <p>{{ $t('auth.confirming') }}</p>
          <UProgress animation="carousel" class="mt-4" />
        </template>
        <template v-else>
          <UIcon name="i-heroicons-exclamation-triangle" class="text-warning text-3xl mx-auto mb-2" />
          <p class="mb-4">{{ $t('auth.confirmError') }}</p>
          <UButton color="primary" block @click="goHome">{{ $t('common.goHome') }}</UButton>
        </template>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { fetchProfile } = useAuth()
const toast = useToast()
const { t } = useI18n()

const hasError = ref(false)

const goHome = () => navigateTo('/')

useSeoMeta({
  title: 'Confirming — My Poop',
  robots: 'noindex',
})

onMounted(async () => {
  try {
    await fetchProfile()
    navigateTo('/')
  } catch (err: any) {
    hasError.value = true
    toast.add({ title: err?.message ?? t('auth.confirmError'), color: 'error' })
  }
})
</script>
