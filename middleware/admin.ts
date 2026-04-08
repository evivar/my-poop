export default defineNuxtRouteMiddleware(async () => {
  const { profile, fetchProfile } = useAuth()
  if (!profile.value) await fetchProfile()
  if (profile.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
