import type { Profile } from '~/types'
import { Capacitor } from '@capacitor/core'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const profile = useState<Profile | null>('profile', () => null)

  const userId = computed(() => (user.value as any)?.id ?? (user.value as any)?.sub ?? null)

  const fetchProfile = async () => {
    if (!userId.value) {
      profile.value = null
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId.value)
      .single()
    profile.value = data as Profile | null
  }

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await fetchProfile()
  }

  const registerWithEmail = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: displayName } },
    })
    if (error) throw error
  }

  const loginWithGoogle = async () => {
    // En nativo, redirigimos al custom scheme para que Android intercepte
    // el callback y abra la app en vez del navegador externo.
    const redirectTo = Capacitor.isNativePlatform()
      ? 'com.mypoop.app://confirm'
      : `${window.location.origin}/confirm`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) throw error
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('signOut error:', error)
    profile.value = null
    reloadNuxtApp({ path: '/' })
  }

  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isBanned = computed(() => profile.value?.is_banned === true)

  return {
    user,
    userId,
    profile,
    fetchProfile,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    isAdmin,
    isBanned,
  }
}
