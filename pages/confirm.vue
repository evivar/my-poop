<template>
  <div class="flex items-center justify-center h-full">
    <UCard>
      <div class="text-center p-4">
        <p>{{ $t('auth.confirming') }}</p>
        <UProgress animation="carousel" class="mt-4" />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { fetchProfile } = useAuth()

onMounted(async () => {
  await fetchProfile()
  navigateTo('/')
})
</script>
