export const useProfile = () => {
  const supabase = useSupabaseClient()
  const { profile, fetchProfile } = useAuth()

  const updateDisplayName = async (displayName: string) => {
    if (!profile.value) return
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', profile.value.id)
    if (error) throw error
    await fetchProfile()
  }

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  return { updateDisplayName, changePassword }
}
