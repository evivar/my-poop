import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const supabase = useServerSupabase()

  // Verify user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*, reviews(*, profiles(display_name))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
