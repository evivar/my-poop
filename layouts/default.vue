<template>
  <div class="h-screen flex flex-col">
    <AppNavbar />
    <main class="flex-1 min-h-0" :class="isMapPage ? 'overflow-hidden' : 'overflow-y-auto'">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const isMapPage = computed(() => route.path === '/')
</script>
