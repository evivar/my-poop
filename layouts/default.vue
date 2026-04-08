<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <AppNavbar />
    <main class="flex-1 relative min-h-0">
      <slot />
    </main>
    <AuthLoginModal />
    <AuthRegisterModal />
    <BathroomDetailModal />
    <BathroomForm />
  </div>
</template>
