<template>
  <div class="relative">
    <UButton
      icon="i-heroicons-funnel"
      color="primary"
      size="lg"
      class="rounded-full shadow-lg"
      @click="open = !open"
    >
      <template v-if="activeCount > 0" #trailing>
        <UBadge color="error" size="xs" class="rounded-full">{{ activeCount }}</UBadge>
      </template>
    </UButton>

    <div v-if="open" class="absolute top-12 left-0 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 space-y-4">
      <div class="flex items-center justify-between">
        <span class="font-semibold text-sm">{{ $t('filters.title') }}</span>
        <UButton v-if="activeCount > 0" variant="link" size="xs" @click="clearAll">
          {{ $t('filters.clearAll') }}
        </UButton>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-gray-400">{{ $t('bathroom.type') }}</span>
        <div class="flex flex-wrap gap-1">
          <UBadge
            v-for="opt in typeOptions"
            :key="opt.value"
            :color="filters.types.includes(opt.value) ? 'primary' : 'neutral'"
            variant="subtle"
            class="cursor-pointer"
            @click="toggleType(opt.value)"
          >
            {{ opt.label }}
          </UBadge>
        </div>
      </div>

      <div class="space-y-2">
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <UCheckbox v-model="filters.onlyFree" />
          <span>{{ $t('filters.onlyFree') }}</span>
        </label>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <UCheckbox v-model="filters.onlyAccessible" />
          <span>{{ $t('filters.onlyAccessible') }}</span>
        </label>
        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <UCheckbox v-model="filters.onlyFavorites" />
          <span>{{ $t('filters.onlyFavorites') }}</span>
        </label>
      </div>

      <div class="space-y-1">
        <span class="text-xs text-gray-400">{{ $t('filters.minRating') }}: {{ filters.minRating > 0 ? filters.minRating : '-' }}</span>
        <div class="flex items-center gap-1">
          <button
            v-for="i in 5"
            :key="i"
            type="button"
            class="text-lg cursor-pointer transition-transform hover:scale-110"
            :class="i <= filters.minRating ? 'opacity-100' : 'opacity-30'"
            @click="filters.minRating = filters.minRating === i ? 0 : i"
          >
            🧻
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BathroomType } from '~/types'

const { t } = useI18n()

const filters = defineModel<{
  types: BathroomType[]
  onlyFree: boolean
  onlyAccessible: boolean
  onlyFavorites: boolean
  minRating: number
}>({ required: true })

const open = ref(false)

const typeOptions = computed(() => [
  { label: t('bathroom.types.public'), value: 'public' as BathroomType },
  { label: t('bathroom.types.restaurant'), value: 'restaurant' as BathroomType },
  { label: t('bathroom.types.gas_station'), value: 'gas_station' as BathroomType },
  { label: t('bathroom.types.mall'), value: 'mall' as BathroomType },
  { label: t('bathroom.types.cafe'), value: 'cafe' as BathroomType },
  { label: t('bathroom.types.hotel'), value: 'hotel' as BathroomType },
  { label: t('bathroom.types.hospital'), value: 'hospital' as BathroomType },
  { label: t('bathroom.types.other'), value: 'other' as BathroomType },
])

const activeCount = computed(() => {
  let count = 0
  if (filters.value.types.length > 0) count++
  if (filters.value.onlyFree) count++
  if (filters.value.onlyAccessible) count++
  if (filters.value.onlyFavorites) count++
  if (filters.value.minRating > 0) count++
  return count
})

const toggleType = (type: BathroomType) => {
  const idx = filters.value.types.indexOf(type)
  if (idx >= 0) {
    filters.value.types.splice(idx, 1)
  } else {
    filters.value.types.push(type)
  }
}

const clearAll = () => {
  filters.value.types = []
  filters.value.onlyFree = false
  filters.value.onlyAccessible = false
  filters.value.onlyFavorites = false
  filters.value.minRating = 0
}
</script>
