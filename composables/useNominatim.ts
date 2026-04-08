import type { NominatimResult } from '~/types'

export const useNominatim = () => {
  const results = ref<NominatimResult[]>([])
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
        const data = await $fetch<NominatimResult[]>(
          'https://nominatim.openstreetmap.org/search',
          {
            params: {
              q: query,
              format: 'json',
              limit: 5,
              addressdetails: 1,
            },
            headers: {
              'User-Agent': 'MyPoop/1.0',
            },
          },
        )
        results.value = data
      } catch {
        results.value = []
      } finally {
        loading.value = false
      }
    }, 400)
  }

  const clear = () => {
    results.value = []
  }

  return { results, loading, search, clear }
}
