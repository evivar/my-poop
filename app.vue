<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AuthLoginModal />
    <AuthRegisterModal />
    <BathroomDetailModal />
    <BathroomForm />
    <ClientOnly>
      <AppIosPwaPrompt />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
const route = useRoute()

useHead({
  link: [
    { rel: 'canonical', href: () => `https://my-poop.vercel.app${route.path}` },
  ],
})
</script>
