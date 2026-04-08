<template>
  <ClientOnly>
    <MapView />
    <template #fallback>
      <div class="flex items-center justify-center h-full">
        <UProgress animation="carousel" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
// Bathrooms se cargan en MapView según el bbox visible del mapa (bbox-based fetch)
</script>
