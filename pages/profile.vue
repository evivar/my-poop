<template>
  <div class="max-w-4xl mx-auto p-6">
    <div class="flex items-center gap-3 mb-4">
      <UButton
        icon="i-heroicons-arrow-left"
        variant="ghost"
        size="lg"
        to="/"
      />
      <h1 class="text-lg font-semibold">{{ $t('profile.title') }}</h1>
    </div>
    <UTabs :items="tabs">
      <template #info>
        <ProfileInfo />
      </template>
      <template #favorites>
        <ProfileFavoritesList />
      </template>
      <template #reviews>
        <ProfileReviewHistory />
      </template>
      <template v-if="isAdmin" #moderation>
        <ProfileModerationPanel />
      </template>
    </UTabs>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { isAdmin } = useAuth()
const { t } = useI18n()

const tabs = computed(() => {
  const items: { label: string; slot: string }[] = [
    { label: t('profile.title'), slot: 'info' },
    { label: t('profile.favorites'), slot: 'favorites' },
    { label: t('profile.myReviews'), slot: 'reviews' },
  ]
  if (isAdmin.value) {
    items.push({ label: t('profile.moderation'), slot: 'moderation' })
  }
  return items
})
</script>
