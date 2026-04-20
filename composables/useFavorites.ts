import type { Bathroom } from '~/types'

export const useFavorites = () => {
  const favoriteIds = useState<Set<string>>('favoriteIds', () => new Set())
  const supabase = useSupabaseClient()
  const { userId } = useAuth()

  const fetchFavorites = async () => {
    if (!userId.value) {
      favoriteIds.value = new Set()
      return
    }
    const { data } = await supabase
      .from('favorites')
      .select('bathroom_id')
      .eq('user_id', userId.value)
    favoriteIds.value = new Set((data ?? []).map(f => f.bathroom_id))
  }

  const fetchFavoriteBathrooms = async (): Promise<Bathroom[]> => {
    if (!userId.value) return []
    const { data, error } = await supabase
      .from('favorites')
      .select('bathroom_id, bathrooms(*)')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((f: any) => f.bathrooms).filter(Boolean)
  }

  const toggleFavorite = async (bathroomId: string) => {
    if (!userId.value) return
    const isFav = favoriteIds.value.has(bathroomId)
    if (isFav) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId.value)
        .eq('bathroom_id', bathroomId)
      favoriteIds.value.delete(bathroomId)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: userId.value, bathroom_id: bathroomId })
      favoriteIds.value.add(bathroomId)
    }
    // Trigger reactivity
    favoriteIds.value = new Set(favoriteIds.value)
  }

  const isFavorite = (bathroomId: string) => {
    return favoriteIds.value.has(bathroomId)
  }

  return { favoriteIds, fetchFavorites, fetchFavoriteBathrooms, toggleFavorite, isFavorite }
}
