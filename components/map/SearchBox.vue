<template>
  <div class="lg:w-md">
    <UInput
      v-model="query"
      :placeholder="$t('map.searchPlaceholder')"
      icon="i-heroicons-magnifying-glass"
      size="xl"
      class="shadow-lg w-full"
    />
    <UCard v-if="showResults && results.length > 0" class="mt-1 max-h-60 overflow-y-auto reviews-scroll shadow-lg">
      <ul class="divide-y divide-gray-800">
        <li
          v-for="(result, i) in results"
          :key="i"
          class="p-2 cursor-pointer hover:bg-gray-800 rounded text-sm"
          @click="selectResult(result)"
        >
          {{ result.displayName }}
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { GeocoderResult } from '~/types'

const emit = defineEmits<{
  select: [coords: { lat: number; lng: number }]
}>()

const { results, search, clear } = useGeocoder()
const query = ref('')
const showResults = ref(true)

watch(query, (val) => {
  showResults.value = true
  search(val)
})

const selectResult = (result: GeocoderResult) => {
  showResults.value = false
  emit('select', { lat: result.lat, lng: result.lng })
  query.value = result.displayName
  clear()
}
</script>
