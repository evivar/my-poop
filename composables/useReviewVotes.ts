export const useReviewVotes = () => {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()

  const toggleVote = async (reviewId: string) => {
    if (!userId.value) return

    const { data: existing } = await supabase
      .from('review_votes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId.value)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('review_votes')
        .delete()
        .eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('review_votes')
        .insert({ review_id: reviewId, user_id: userId.value })
      if (error) throw error
    }
  }

  const fetchUserVotes = async (reviewIds: string[]): Promise<Set<string>> => {
    if (!userId.value || reviewIds.length === 0) return new Set()

    const { data, error } = await supabase
      .from('review_votes')
      .select('review_id')
      .eq('user_id', userId.value)
      .in('review_id', reviewIds)

    if (error) throw error
    return new Set((data ?? []).map(v => v.review_id))
  }

  return { toggleVote, fetchUserVotes }
}
