import type { Report } from '~/types'

export const useModeration = () => {
  const supabase = useSupabaseClient()

  const fetchPendingReports = async (): Promise<Report[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*, reviews(*, profiles(display_name))')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as Report[]
  }

  const approveReview = async (reportId: string, reviewId: string, moderatorId: string) => {
    await supabase
      .from('reviews')
      .update({ is_hidden: false })
      .eq('id', reviewId)
    await supabase
      .from('reports')
      .update({
        status: 'rejected' as const,
        moderated_by: moderatorId,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
  }

  const deleteReview = async (reportId: string, reviewId: string, moderatorId: string) => {
    await supabase
      .from('reports')
      .update({
        status: 'approved' as const,
        moderated_by: moderatorId,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
    await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
  }

  const banUser = async (userId: string) => {
    await supabase
      .from('profiles')
      .update({ is_banned: true })
      .eq('id', userId)
  }

  return { fetchPendingReports, approveReview, deleteReview, banUser }
}
