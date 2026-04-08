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

  // Mark report as approved (review should be deleted)
  await supabase.from('reports').update({
    status: 'approved',
    moderated_by: user.id,
    moderated_at: new Date().toISOString(),
  }).eq('id', reportId)

  // Delete the review
  await supabase.from('reviews').delete().eq('id', reviewId)

  return { success: true }
})
