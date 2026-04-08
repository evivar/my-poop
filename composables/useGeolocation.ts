import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export const useGeolocation = () => {
  const coords = ref<{ lat: number; lng: number } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const getCurrentPosition = async () => {
    loading.value = true
    error.value = null
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions()
        if (permission.location !== 'granted') {
          error.value = 'Location permission denied'
          return
        }
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })
        coords.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      } else {
        if (!navigator.geolocation) {
          error.value = 'Geolocation is not supported'
          return
        }
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              coords.value = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              resolve()
            },
            (err) => {
              error.value = err.message
              resolve()
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        })
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to get location'
    } finally {
      loading.value = false
    }
  }

  return { coords, error, loading, getCurrentPosition }
}
