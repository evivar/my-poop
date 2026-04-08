<template>
  <div class="space-y-6 p-4">
    <div class="space-y-4">
      <UFormField :label="$t('auth.displayName')">
        <UInput v-model="displayName" class="w-full" />
      </UFormField>
      <UFormField :label="$t('auth.email')">
        <UInput :model-value="user?.email" class="w-full" disabled />
      </UFormField>
      <UButton color="primary" :loading="savingProfile" @click="saveProfile">
        {{ $t('profile.save') }}
      </UButton>
    </div>

    <USeparator />

    <div class="space-y-4">
      <h4 class="font-semibold">{{ $t('profile.changePassword') }}</h4>
      <UFormField :label="$t('profile.newPassword')">
        <UInput v-model="newPassword" type="password" class="w-full" />
      </UFormField>
      <UFormField :label="$t('auth.confirmPassword')">
        <UInput v-model="confirmPassword" type="password" class="w-full" />
      </UFormField>
      <UButton color="primary" :loading="savingPassword" :disabled="!isPasswordValid" @click="savePassword">
        {{ $t('profile.changePassword') }}
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, profile } = useAuth()
const { updateDisplayName, changePassword } = useProfile()
const toast = useToast()
const { t } = useI18n()

const displayName = ref(profile.value?.display_name ?? '')
const savingProfile = ref(false)

watch(() => profile.value?.display_name, (name) => {
  if (name) displayName.value = name
})

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await updateDisplayName(displayName.value)
    toast.add({ title: t('profile.saved'), color: 'success' })
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    savingProfile.value = false
  }
}

const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)

const isPasswordValid = computed(() =>
  newPassword.value.length >= 6 && newPassword.value === confirmPassword.value,
)

const savePassword = async () => {
  savingPassword.value = true
  try {
    await changePassword(newPassword.value)
    toast.add({ title: t('profile.saved'), color: 'success' })
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    savingPassword.value = false
  }
}
</script>
