import type { Bathroom } from '~/types'

export interface BathroomBounds {
  south: number
  west: number
  north: number
  east: number
}

export const useBathrooms = () => {
  const supabase = useSupabaseClient()
  const bathrooms = useState<Bathroom[]>('bathrooms', () => [])

  /**
   * Fetch bathrooms dentro del bbox dado y mergea con el estado existente
   * (dedupe por id). No elimina baños fuera del bbox — esto permite que
   * el usuario pueda panear sin perder markers ya vistos.
   *
   * Hace paginación interna en páginas de 1000 (límite de PostgREST) porque
   * algunas ciudades densas (Paris, Tokyo) superan 1000 baños en su bbox.
   */
  const fetchBathroomsInBbox = async (bounds: BathroomBounds) => {
    const PAGE_SIZE = 1000
    const fetched: Bathroom[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('bathrooms')
        .select('*')
        .gte('latitude', bounds.south)
        .lte('latitude', bounds.north)
        .gte('longitude', bounds.west)
        .lte('longitude', bounds.east)
        .range(from, from + PAGE_SIZE - 1)
      if (error) throw error
      const page = (data ?? []) as Bathroom[]
      fetched.push(...page)
      if (page.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    const fetchedMap = new Map(fetched.map(b => [b.id, b]))
    // Actualiza los existentes que estén en el fetch (avg_rating puede haber cambiado)
    // y añade los nuevos.
    const merged = bathrooms.value.map(b => fetchedMap.get(b.id) ?? b)
    const existingIds = new Set(merged.map(b => b.id))
    for (const b of fetched) {
      if (!existingIds.has(b.id)) merged.push(b)
    }
    bathrooms.value = merged
    return fetched
  }

  /**
   * Refrescar un único baño desde la BBDD y actualizarlo en el estado.
   * Útil después de crear/editar reviews para ver el nuevo avg_rating.
   */
  const refreshBathroom = async (id: string) => {
    const { data, error } = await supabase
      .from('bathrooms')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    const updated = data as Bathroom
    const idx = bathrooms.value.findIndex(b => b.id === id)
    if (idx >= 0) {
      bathrooms.value[idx] = updated
    }
    else {
      bathrooms.value.push(updated)
    }
    return updated
  }

  /**
   * Actualizar campos editables de un baño y reflejarlo en el estado local.
   * Para baños OSM, el trigger SQL bloquea automáticamente cualquier campo
   * locked (lat/lng/ratings/etc), así que aquí no validamos nada extra.
   */
  const updateBathroom = async (
    id: string,
    fields: {
      name?: string
      type?: string
      is_accessible?: boolean
      is_free?: boolean
      schedule?: string | null
      directions?: string | null
    },
  ) => {
    const { data, error } = await supabase
      .from('bathrooms')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    const updated = data as Bathroom
    const idx = bathrooms.value.findIndex(b => b.id === id)
    if (idx >= 0) {
      bathrooms.value[idx] = updated
    }
    return updated
  }

  const createBathroom = async (bathroom: {
    name: string
    latitude: number
    longitude: number
    type: string
    is_accessible: boolean
    is_free: boolean
    directions?: string
    schedule?: string
    created_by: string
  }) => {
    const { data, error } = await supabase
      .from('bathrooms')
      .insert({
        ...bathroom,
        location: `POINT(${bathroom.longitude} ${bathroom.latitude})`,
      })
      .select()
      .single()
    if (error) throw error
    const newBathroom = data as Bathroom
    bathrooms.value.push(newBathroom)
    return newBathroom
  }

  const fetchBathroomById = async (id: string): Promise<Bathroom | null> => {
    const { data, error } = await supabase
      .from('bathrooms')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as Bathroom
  }

  return {
    bathrooms,
    fetchBathroomsInBbox,
    refreshBathroom,
    createBathroom,
    updateBathroom,
    fetchBathroomById,
  }
}
