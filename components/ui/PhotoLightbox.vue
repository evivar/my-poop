<template>
  <div
    v-if="src"
    class="fixed inset-0 z-99999 flex items-center justify-center bg-black/90"
    @click.stop="close"
    @mousedown.stop
    @pointerdown.stop
  >
    <button
      class="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800/80 text-white flex items-center justify-center text-xl hover:bg-gray-700 transition-colors cursor-pointer"
      @click.stop="close"
    >
      ✕
    </button>
    <img
      :src="src"
      class="max-w-full max-h-full object-contain p-4"
      @click.stop
    />
  </div>
</template>

<script setup lang="ts">
const src = defineModel<string | null>({ default: null })

const close = () => {
  src.value = null
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopImmediatePropagation()
    close()
  }
}

watch(src, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown, { capture: true })
  } else {
    document.removeEventListener('keydown', onKeydown, { capture: true })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown, { capture: true })
})
</script>
