import type { BathroomStatusType, ActiveStatus } from '~/types'

export const useBathroomStatus = () => {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { t } = useI18n()

  const reportStatus = async (bathroomId: string, status: BathroomStatusType) => {
    if (!userId.value) return

    // Anti-spam: check if user already reported this status in the last 4 hours
    const { count } = await supabase
      .from('bathroom_status')
      .select('*', { count: 'exact', head: true })
      .eq('bathroom_id', bathroomId)
      .eq('user_id', userId.value)
      .eq('status', status)
      .gt('created_at', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())

    if (count && count > 0) {
      throw new Error('already_reported')
    }

    const { error } = await supabase
      .from('bathroom_status')
      .insert({ bathroom_id: bathroomId, user_id: userId.value, status })
    if (error) throw error
  }

  const fetchActiveStatuses = async (bathroomId: string): Promise<ActiveStatus[]> => {
    const { data, error } = await supabase
      .rpc('get_active_bathroom_statuses', { p_bathroom_id: bathroomId })
    if (error) throw error
    return (data ?? []) as ActiveStatus[]
  }

  const statusConfig: Record<BathroomStatusType, { icon: string; color: string }> = {
    no_paper: { icon: 'i-heroicons-x-circle', color: 'warning' },
    dirty: { icon: 'i-heroicons-exclamation-triangle', color: 'warning' },
    closed: { icon: 'i-heroicons-lock-closed', color: 'error' },
    out_of_order: { icon: 'i-heroicons-wrench-screwdriver', color: 'error' },
    flooded: { icon: 'i-heroicons-exclamation-circle', color: 'info' },
  }

  const getStatusLabel = (status: BathroomStatusType): string => {
    return t(`status.types.${status}`)
  }

  const getStatusConfig = (status: BathroomStatusType) => {
    return statusConfig[status]
  }

  return { reportStatus, fetchActiveStatuses, getStatusLabel, getStatusConfig }
}
