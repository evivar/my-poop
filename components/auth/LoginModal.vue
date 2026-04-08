<template>
  <UModal v-model:open="loginOpen" :title="$t('auth.login')" :description="$t('auth.login')">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('auth.login') }}</h3>
            <UButton icon="i-heroicons-x-mark" variant="ghost" @click="loginOpen = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <UFormField :label="$t('auth.email')">
            <UInput v-model="email" type="email" class="w-full" required />
          </UFormField>
          <UFormField :label="$t('auth.password')">
            <UInput v-model="password" type="password" class="w-full" required />
          </UFormField>
          <UButton type="submit" color="primary" block :loading="loading">
            {{ $t('auth.login') }}
          </UButton>
        </form>

        <USeparator label="or" class="my-4" />

        <UButton
          icon="i-simple-icons-google"
          color="neutral"
          variant="solid"
          block
          @click="handleGoogleLogin"
        >
          {{ $t('auth.loginWithGoogle') }}
        </UButton>

        <template #footer>
          <p class="text-sm text-center text-gray-400">
            {{ $t('auth.noAccount') }}
            <UButton variant="link" @click="openRegister">
              {{ $t('auth.register') }}
            </UButton>
          </p>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { loginWithEmail, loginWithGoogle } = useAuth()
const { loginOpen, openRegister } = useAppModals()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    await loginWithEmail(email.value, password.value)
    loginOpen.value = false
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle()
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  }
}
</script>
