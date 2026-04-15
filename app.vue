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
