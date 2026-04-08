import type { GeocoderResult } from '~/types'

interface PhotonFeature {
  properties: {
    osm_id: number
    name?: string
    street?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    locality?: string
    district?: string
  }
  geometry: {
    coordinates: [number, number] // [lng, lat]
  }
}

export const useGeocoder = () => {
  const results = ref<GeocoderResult[]>([])
  const loading = ref(false)

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const search = (query: string) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!query || query.length < 3) {
      results.value = []
      return
    }

    debounceTimer = setTimeout(async () => {
      loading.value = true
      try {
        const data = await $fetch<{ features: PhotonFeature[] }>(
          'https://photon.komoot.io/api/',
          {
            params: {
              q: query,
              limit: 5,
              lang: 'en',
            },
          },
        )
        results.value = (data.features ?? []).map((f) => {
          const p = f.properties
          const parts = [p.name, p.locality || p.district, p.city, p.country].filter(Boolean)
          return {
            name: p.name ?? p.street ?? '',
            displayName: parts.join(', '),
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
          }
        })
      } catch {
        results.value = []
      } finally {
        loading.value = false
      }
    }, 300)
  }

  const clear = () => {
    results.value = []
  }

  return { results, loading, search, clear }
}
