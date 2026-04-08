<template>
  <div class="space-y-4 p-4">
    <UFormField :label="$t('profile.newPassword')">
      <UInput v-model="newPassword" type="password" class="w-full" />
    </UFormField>
    <UFormField :label="$t('auth.confirmPassword')">
      <UInput v-model="confirmPassword" type="password" class="w-full" />
    </UFormField>
    <UButton color="primary" :loading="saving" :disabled="!isValid" @click="save">
      {{ $t('profile.save') }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
const { changePassword } = useProfile()
const toast = useToast()
const { t } = useI18n()

const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)

const isValid = computed(() =>
  newPassword.value.length >= 6 && newPassword.value === confirmPassword.value,
)

const save = async () => {
  saving.value = true
  try {
    await changePassword(newPassword.value)
    toast.add({ title: t('profile.saved'), color: 'success' })
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
