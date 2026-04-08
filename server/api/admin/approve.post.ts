import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const supabase = useServerSupabase()

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { reportId, reviewId } = await readBody(event)

  // Unhide the review
  await supabase.from('reviews').update({ is_hidden: false }).eq('id', reviewId)

  // Mark report as rejected (review is fine)
  await supabase.from('reports').update({
    status: 'rejected',
    moderated_by: user.id,
    moderated_at: new Date().toISOString(),
  }).eq('id', reportId)

  return { success: true }
})
