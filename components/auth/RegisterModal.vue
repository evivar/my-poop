<template>
  <UModal v-model:open="registerOpen" :title="$t('auth.register')" :description="$t('auth.register')">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ $t('auth.register') }}</h3>
            <UButton icon="i-heroicons-x-mark" variant="ghost" @click="registerOpen = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleRegister">
          <UFormField :label="$t('auth.displayName')">
            <UInput v-model="displayName" class="w-full" required />
          </UFormField>
          <UFormField :label="$t('auth.email')">
            <UInput v-model="email" type="email" class="w-full" required />
          </UFormField>
          <UFormField :label="$t('auth.password')">
            <UInput v-model="password" type="password" class="w-full" required />
          </UFormField>
          <UFormField :label="$t('auth.confirmPassword')">
            <UInput v-model="confirmPassword" type="password" class="w-full" required />
          </UFormField>
          <UButton type="submit" color="primary" block :loading="loading">
            {{ $t('auth.register') }}
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
            {{ $t('auth.hasAccount') }}
            <UButton variant="link" @click="openLogin">
              {{ $t('auth.login') }}
            </UButton>
          </p>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { registerWithEmail, loginWithGoogle } = useAuth()
const { registerOpen, openLogin } = useAppModals()
const toast = useToast()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    toast.add({ title: 'Passwords do not match', color: 'error' })
    return
  }
  loading.value = true
  try {
    await registerWithEmail(email.value, password.value, displayName.value)
    toast.add({ title: 'Check your email to confirm your account', color: 'success' })
    registerOpen.value = false
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
