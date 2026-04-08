export default defineNuxtPlugin(async () => {
  const { user, userId, profile, fetchProfile, logout, isBanned } = useAuth()
  const { fetchFavorites } = useFavorites()
  const toast = useToast()

  if (userId.value) {
    await fetchProfile()
    await fetchFavorites()
    if (isBanned.value) {
      toast.add({ title: 'Your account has been suspended', color: 'error' })
      await logout()
    }
  }

  watch(user, async () => {
    if (userId.value) {
      await fetchProfile()
      await fetchFavorites()
      if (isBanned.value) {
        toast.add({ title: 'Your account has been suspended', color: 'error' })
        await logout()
      }
    } else {
      profile.value = null
    }
  })
})
