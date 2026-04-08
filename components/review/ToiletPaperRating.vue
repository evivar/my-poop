<template>
  <div class="flex items-center gap-1">
    <button
      v-for="i in 5"
      :key="i"
      type="button"
      class="transition-transform"
      :class="[
        readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
      ]"
      :disabled="readonly"
      @mouseenter="!readonly && (hovered = i)"
      @mouseleave="!readonly && (hovered = 0)"
      @click="!readonly && selectRating(i)"
    >
      <span
        :class="[
          i <= displayValue ? 'opacity-100' : 'opacity-30 grayscale',
          size === 'sm' ? 'text-sm' : 'text-xl',
        ]"
      >
        🧻
      </span>
    </button>
    <span v-if="showValue" class="ml-1 text-sm text-gray-400">
      {{ displayValue > 0 ? displayValue.toFixed(1) : '' }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue?: number
  readonly?: boolean
  showValue?: boolean
  size?: 'sm' | 'md'
}>(), {
  modelValue: 0,
  readonly: false,
  showValue: false,
  size: 'md',
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const hovered = ref(0)

const displayValue = computed(() => {
  if (hovered.value > 0) return hovered.value
  return props.modelValue
})

const selectRating = (value: number) => {
  emit('update:modelValue', value)
}
</script>
