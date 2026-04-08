import type { Review } from '~/types'

export const useReviews = () => {
  const supabase = useSupabaseClient()

  const fetchReviewsForBathroom = async (bathroomId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(display_name), photos(*)')
      .eq('bathroom_id', bathroomId)
      .eq('is_hidden', false)
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Review[]
  }

  const createReview = async (review: {
    bathroom_id: string
    user_id: string
    rating: number
    cleanliness: number
    privacy: number
    toilet_paper_quality: number
    comment?: string
  }) => {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single()
    if (error) throw error
    return data as Review
  }

  const reportReview = async (reviewId: string, reportedBy: string, reason: string) => {
    const { error } = await supabase
      .from('reports')
      .insert({ review_id: reviewId, reported_by: reportedBy, reason })
    if (error) throw error
  }

  const fetchUserReviews = async (userId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, bathrooms(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Review[]
  }

  const deleteOwnReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
    if (error) throw error
  }

  return { fetchReviewsForBathroom, createReview, reportReview, fetchUserReviews, deleteOwnReview }
}
