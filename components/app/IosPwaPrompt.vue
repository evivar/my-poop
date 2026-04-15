<template>
  <Transition name="slide-up">
    <div
      v-if="show"
      class="fixed bottom-0 inset-x-0 z-[1100] bg-gray-900 border-t border-gray-800 px-4 py-3 flex items-center gap-3 shadow-lg"
    >
      <img src="/favicon-96x96.png" alt="My Poop" class="w-8 h-8 shrink-0" />
      <div class="flex-1 min-w-0">
        <p class="font-medium text-white text-sm">{{ $t('pwa.installTitle') }}</p>
        <p class="text-gray-400 text-xs mt-0.5">
          {{ $t('pwa.installSteps') }}
        </p>
      </div>
      <UButton size="xs" variant="ghost" icon="i-heroicons-x-mark" @click="dismiss" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { show, dismiss } = useIosPwaPrompt()
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
