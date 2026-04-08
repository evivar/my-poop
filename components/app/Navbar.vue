<template>
  <nav class="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 z-50">
    <NuxtLink to="/" class="flex items-center gap-2">
      <AppLogo />
      <span class="text-lg font-bold text-white">{{ $t('app.name') }}</span>
    </NuxtLink>
    <ClientOnly>
      <div class="flex items-center gap-2">
        <template v-if="!user">
          <UButton variant="ghost" @click="openLogin">
            {{ $t('auth.login') }}
          </UButton>
          <UButton color="primary" @click="openRegister">
            {{ $t('auth.register') }}
          </UButton>
        </template>
        <template v-else>
          <UDropdownMenu :items="userMenuItems">
            <button class="w-9 h-9 rounded-full bg-primary-500 text-white font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-primary-400 transition-colors">
              {{ avatarInitial }}
            </button>
          </UDropdownMenu>
        </template>
      </div>
    </ClientOnly>
  </nav>
</template>

<script setup lang="ts">
const { user, profile, logout } = useAuth()
const { openLogin, openRegister } = useAppModals()

const avatarInitial = computed(() => {
  return profile.value?.display_name?.charAt(0)?.toUpperCase() || '?'
})
const { t } = useI18n()

const userMenuItems = computed(() => [
  [{
    label: t('profile.title'),
    icon: 'i-heroicons-user',
    to: '/profile',
  }],
  [{
    label: t('auth.logout'),
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: logout,
  }],
])
</script>
