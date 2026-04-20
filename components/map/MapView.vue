<template>
  <div class="relative w-full h-full">
    <div ref="mapContainer" class="w-full h-full z-0" />
    <div class="absolute top-4 left-4 z-1000 flex flex-col sm:flex-row items-start gap-2">
      <MapSearchBox @select="flyTo" />
      <MapFilters v-model="filters" />
    </div>
    <UButton
      icon="i-heroicons-map-pin"
      color="neutral"
      variant="solid"
      size="lg"
      class="absolute bottom-6 left-16 z-1000 rounded-full shadow-lg"
      :title="$t('map.locateMe')"
      :aria-label="$t('map.locateMe')"
      :loading="locating"
      @click="goToMyLocation"
    />
    <!-- Empty state: no bathrooms visible -->
    <div
      v-if="filteredBathrooms.length === 0 && !loadingBathrooms"
      class="absolute top-20 left-1/2 -translate-x-1/2 z-1000 bg-gray-900/90 backdrop-blur px-4 py-2 rounded-lg text-sm text-gray-400 shadow-lg"
    >
      {{ $t('map.noBathroomsInArea') }}
    </div>

    <div class="absolute bottom-6 right-6 z-1000 flex flex-col items-center gap-3">
      <MapNearestBathroomButton @found="onNearestFound" />
      <UButton
        v-if="user"
        icon="i-heroicons-plus"
        color="primary"
        size="xl"
        class="rounded-full shadow-lg p-4!"
        :title="$t('bathroom.addBathroom')"
        @click="openBathroomForm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bathroom, BathroomType } from '~/types'
import { Capacitor } from '@capacitor/core'

interface Props {
  /** Si se pasa, el mapa se centra aquí en vez de pedir geolocalización */
  initialCenter?: [number, number]
  /** Zoom inicial — solo aplica si se pasa initialCenter */
  initialZoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialCenter: undefined,
  initialZoom: 14,
})

const { bathrooms, fetchBathroomsInBbox } = useBathrooms()
const { coords: userCoords, getCurrentPosition } = useGeolocation()
const { user } = useAuth()
const { favoriteIds } = useFavorites()
const { openBathroomDetail, openBathroomForm } = useAppModals()

const filters = ref({
  types: [] as BathroomType[],
  onlyFree: false,
  onlyAccessible: false,
  onlyFavorites: false,
  minRating: 0,
})

const filteredBathrooms = computed(() => {
  return bathrooms.value.filter((b) => {
    if (filters.value.types.length > 0 && !filters.value.types.includes(b.type)) return false
    if (filters.value.onlyFree && !b.is_free) return false
    if (filters.value.onlyAccessible && !b.is_accessible) return false
    if (filters.value.onlyFavorites && !favoriteIds.value.has(b.id)) return false
    if (filters.value.minRating > 0 && b.avg_rating < filters.value.minRating) return false
    return true
  })
})

const mapContainer = ref<HTMLElement | null>(null)

// Country detectado server-side via x-vercel-ip-country / cf-ipcountry.
// Si está disponible, lo usamos para elegir un fallback más cercano al usuario
// (p.ej. Tokyo para JP) en vez del Madrid hardcoded.
const userCountry = useState<string | null>('userCountry', () => null)
const defaultCenter = computed<[number, number]>(() => {
  if (userCountry.value) {
    const city = getCityForCountryCode(userCountry.value)
    if (city) return getCityCenter(city)
  }
  return [40.4168, -3.7038] // Madrid: fallback de último recurso
})

let map: any = null
let clusterGroup: any = null
let userMarker: any = null
let L: any = null
let moveendTimer: ReturnType<typeof setTimeout> | null = null
// True si arrancamos con el fallback (no la ubicación real del usuario) porque
// la geolocalización tardó más que el timeout. Se usa para que el watcher de
// userCoords haga flyTo una única vez cuando las coords reales lleguen tarde.
let usedFallback = false
const locating = ref(false)
const loadingBathrooms = ref(true)

// Carga baños dentro del bbox actual del mapa, expandido un 50% en cada
// dirección para prefetch. Evita re-fetches mientras el usuario panea dentro
// del margen pre-cargado.
const loadBathroomsForViewport = async () => {
  if (!map) return
  loadingBathrooms.value = true
  const bounds = map.getBounds()
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const latMargin = (ne.lat - sw.lat) * 0.5
  const lngMargin = (ne.lng - sw.lng) * 0.5
  try {
    await fetchBathroomsInBbox({
      south: sw.lat - latMargin,
      north: ne.lat + latMargin,
      west: sw.lng - lngMargin,
      east: ne.lng + lngMargin,
    })
  }
  catch (e) {
    console.error('Failed to fetch bathrooms for viewport:', e)
  }
  finally {
    loadingBathrooms.value = false
  }
}

onMounted(async () => {
  // Si el padre nos pasa initialCenter (p.ej. desde la página de ciudad),
  // saltamos la geolocalización y usamos esas coordenadas directamente.
  if (props.initialCenter) {
    // Disparamos getCurrentPosition igual para que aparezca el marker del usuario
    // si está cerca, pero NO esperamos a que resuelva.
    getCurrentPosition().catch(() => {})
    await initMap(props.initialCenter, props.initialZoom)
    return
  }

  // Start geolocation request (async on native, needs more time for permission dialog)
  const geoPromise = getCurrentPosition()

  // Wait for geolocation or timeout before showing the map
  const center = await new Promise<[number, number]>((resolve) => {
    if (userCoords.value) {
      resolve([userCoords.value.lat, userCoords.value.lng])
      return
    }
    // En nativo, esperamos más (10s) porque el dialog de permisos del SO
    // puede tardar. En web, 1.5s y el late-fly se encarga si llegan después.
    const timeoutMs = Capacitor.isNativePlatform() ? 10000 : 1500
    const timeout = setTimeout(() => {
      stop()
      usedFallback = true
      resolve(defaultCenter.value)
    }, timeoutMs)

    const stop = watch(userCoords, (c) => {
      if (c) {
        clearTimeout(timeout)
        stop()
        resolve([c.lat, c.lng])
      }
    })

    // Also resolve when the geo promise finishes (in case coords were set)
    geoPromise.then(() => {
      if (userCoords.value) {
        clearTimeout(timeout)
        stop()
        resolve([userCoords.value.lat, userCoords.value.lng])
      }
    })
  })

  await initMap(center)
})

onUnmounted(() => {
  if (moveendTimer) clearTimeout(moveendTimer)
  if (map) {
    map.remove()
    map = null
  }
})

const initMap = async (center: [number, number], zoom: number = 15) => {
  if (!mapContainer.value) return

  const leafletModule = await import('leaflet')
  L = leafletModule.default || leafletModule

  map = L.map(mapContainer.value, {
    center,
    zoom,
    zoomControl: false,
  })

  L.control.zoom({ position: 'bottomleft' }).addTo(map)
  L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)

  // Bbox-based fetch: cada vez que el usuario mueve el mapa cargamos los
  // baños visibles. Debounce 300ms para evitar fetches durante paneos rápidos.
  map.on('moveend', () => {
    if (moveendTimer) clearTimeout(moveendTimer)
    moveendTimer = setTimeout(loadBathroomsForViewport, 300)
  })

  await initClusterGroup()

  // Fetch inicial con el bbox del viewport una vez el mapa está listo
  await loadBathroomsForViewport()

  // Place user marker if coords already available
  if (userCoords.value && L) {
    userMarker = L.marker([userCoords.value.lat, userCoords.value.lng], {
      icon: L.icon({
        iconUrl: '/markers/user-location.svg',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map)
  }

  // Fly to query params if present (e.g. from favorites)
  const route = useRoute()
  if (route.query.lat && route.query.lng) {
    const lat = parseFloat(route.query.lat as string)
    const lng = parseFloat(route.query.lng as string)
    const zoom = route.query.zoom ? parseInt(route.query.zoom as string) : 16
    map.flyTo([lat, lng], zoom)
  }
}

const initClusterGroup = async () => {
  await import('leaflet.markercluster')
  await import('leaflet.markercluster/dist/MarkerCluster.css')
  await import('leaflet.markercluster/dist/MarkerCluster.Default.css')

  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
  })

  map.addLayer(clusterGroup)

  watch([filteredBathrooms, favoriteIds], ([baths]) => {
    updateMarkers(baths)
  }, { immediate: true })
}

watch(userCoords, (newCoords) => {
  if (!newCoords || !map || !L) return

  if (userMarker) {
    userMarker.setLatLng([newCoords.lat, newCoords.lng])
  }
  else {
    userMarker = L.marker([newCoords.lat, newCoords.lng], {
      icon: L.icon({
        iconUrl: '/markers/user-location.svg',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
    }).addTo(map)
  }

  // Si arrancamos con el fallback Madrid porque la geolocalización tardó
  // más de lo esperado, ahora que sí tenemos coords reales volamos al
  // usuario una única vez. Si ya está en su zona o ha pasado por aquí, no
  // hacemos nada (`usedFallback` se desactiva tras el primer fly).
  if (usedFallback) {
    usedFallback = false
    map.flyTo([newCoords.lat, newCoords.lng], 15)
  }
})

const updateMarkers = (baths: Bathroom[]) => {
  if (!clusterGroup || !L) return
  clusterGroup.clearLayers()

  baths.forEach((b) => {
    const isFav = favoriteIds.value.has(b.id)
    const marker = L.marker([b.latitude, b.longitude], {
      icon: L.icon({
        iconUrl: isFav ? '/markers/bathroom-favorite.svg' : '/markers/bathroom-marker.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    })
    marker.bindTooltip(`${b.name} - ${(b.avg_rating ?? 0).toFixed(1)}`)
    marker.on('click', () => openBathroomDetail(b))
    clusterGroup.addLayer(marker)
  })
}

const flyTo = (coords: { lat: number; lng: number }) => {
  if (map) {
    map.flyTo([coords.lat, coords.lng], 16)
  }
}

const onNearestFound = (target: { lat: number; lng: number }) => {
  map?.flyTo([target.lat, target.lng], 17)
}

const goToMyLocation = () => {
  if (userCoords.value) {
    map?.flyTo([userCoords.value.lat, userCoords.value.lng], 16)
    return
  }
  locating.value = true
  getCurrentPosition()
  const stop = watch(userCoords, (coords) => {
    if (coords) {
      map?.flyTo([coords.lat, coords.lng], 16)
      locating.value = false
      stop()
    }
  })
  setTimeout(() => { locating.value = false; stop() }, 10000)
}

</script>
