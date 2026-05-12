import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export const useGeolocation = () => {
  const coords = useState<{ lat: number, lng: number } | null>('geo-coords', () => null)
  const error = useState<string | null>('geo-error', () => null)
  const loading = useState('geo-loading', () => false)
  const { t } = useI18n()

  const getCurrentPosition = async () => {
    loading.value = true
    error.value = null
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions()
        if (permission.location !== 'granted') {
          error.value = t('geolocation.permissionDenied')
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
      }
      else {
        if (!navigator.geolocation) {
          error.value = t('geolocation.notSupported')
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
              error.value = err.message || t('geolocation.failed')
              resolve()
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        })
      }
    }
    catch (e: any) {
      error.value = e.message ?? t('geolocation.failed')
    }
    finally {
      loading.value = false
    }
  }

  return { coords, error, loading, getCurrentPosition }
}
