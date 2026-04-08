import type { Bathroom } from '~/types'
import { haversineDistance, formatDistance } from '~/utils/haversine'

export const useNearestBathroom = () => {
  const { bathrooms } = useBathrooms()
  const { coords, getCurrentPosition } = useGeolocation()

  const finding = ref(false)

  const findNearest = async (): Promise<{ bathroom: Bathroom; distance: number; formatted: string } | null> => {
    finding.value = true
    try {
      if (!coords.value) {
        getCurrentPosition()
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => { stop(); resolve() }, 10000)
          const stop = watch(coords, (c) => {
            if (c) { clearTimeout(timeout); stop(); resolve() }
          })
        })
      }

      if (!coords.value || bathrooms.value.length === 0) return null

      let nearest: Bathroom | null = null
      let minDist = Infinity

      for (const b of bathrooms.value) {
        const dist = haversineDistance(
          coords.value.lat, coords.value.lng,
          b.latitude, b.longitude,
        )
        if (dist < minDist) {
          minDist = dist
          nearest = b
        }
      }

      if (!nearest) return null
      return { bathroom: nearest, distance: minDist, formatted: formatDistance(minDist) }
    } finally {
      finding.value = false
    }
  }

  const openNavigation = (lat: number, lng: number, name: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const url = isIOS
      ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
      : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`
    window.open(url, '_system')
  }

  return { finding, findNearest, openNavigation }
}
