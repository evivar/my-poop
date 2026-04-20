<template>
  <footer class="px-4 py-1.5 border-t border-gray-800 text-xs text-gray-500 flex items-center justify-between">
    <span>&copy; {{ new Date().getFullYear() }} My Poop</span>
    <div class="flex items-center gap-3">
      <NuxtLink to="/about" class="hover:text-gray-300">{{ $t('nav.about') }}</NuxtLink>
      <NuxtLink to="/privacy" class="hover:text-gray-300">{{ $t('nav.privacy') }}</NuxtLink>
      <button
        class="hover:text-gray-300 cursor-pointer"
        @click="toggleLocale"
      >
        {{ locale === 'en' ? 'ES' : 'EN' }}
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { locale, setLocale } = useI18n()

const toggleLocale = () => {
  setLocale(locale.value === 'en' ? 'es' : 'en')
}
</script>
