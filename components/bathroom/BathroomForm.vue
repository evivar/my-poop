<template>
  <UModal v-model:open="bathroomFormOpen" :title="modalTitle" :description="modalTitle" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UFormField :label="$t('bathroom.name')" required>
          <UInput v-model="form.name" class="w-full" required />
        </UFormField>

        <UFormField :label="$t('bathroom.type')" required>
          <USelect v-model="form.type" :items="typeOptions" class="w-full" required />
        </UFormField>

        <!-- Location section: solo en modo create. En edit no se pueden tocar coordenadas. -->
        <UFormField v-if="!isEditMode" :label="$t('bathroom.location')" required>
          <div class="space-y-2">
            <UInput
              v-model="locationQuery"
              :placeholder="$t('map.searchPlaceholder')"
              icon="i-heroicons-magnifying-glass"
              class="w-full"
            />
            <ul v-if="showLocationResults && geocoderResults.length > 0" class="border border-gray-700 rounded-lg max-h-32 overflow-y-auto reviews-scroll">
              <li
                v-for="(result, i) in geocoderResults"
                :key="i"
                class="px-3 py-2 cursor-pointer hover:bg-gray-800 text-sm"
                @click="selectLocation(result)"
              >
                {{ result.displayName }}
              </li>
            </ul>
            <div ref="miniMapContainer" class="w-full h-52 rounded-lg border border-gray-700 z-0" />
            <p class="text-xs text-gray-400">{{ $t('bathroom.tapMapToSet') }}</p>
          </div>
        </UFormField>

        <div class="flex gap-4">
          <UCheckbox v-model="form.is_accessible" :label="$t('bathroom.accessible')" />
          <UCheckbox v-model="form.is_free" :label="$t('bathroom.free')" />
        </div>

        <UFormField :label="$t('bathroom.directions')">
          <UTextarea v-model="form.directions" :placeholder="$t('bathroom.directionsPlaceholder')" class="w-full" />
        </UFormField>

        <UFormField :label="$t('bathroom.schedule')">
          <UInput v-model="form.schedule" :placeholder="$t('bathroom.schedulePlaceholder')" class="w-full" />
        </UFormField>

        <!-- Photos: solo en modo create por ahora. En edit lo gestionará el modal de detalle. -->
        <UFormField v-if="!isEditMode" :label="$t('photos.photos')">
          <UiPhotoUploader v-model:files="photos" :max-photos="5" />
        </UFormField>

        <UButton type="submit" color="primary" block :loading="loading">
          {{ submitLabel }}
        </UButton>
      </form>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { BathroomType, GeocoderResult } from '~/types'

const { createBathroom, updateBathroom, refreshBathroom } = useBathrooms()
const { userId } = useAuth()
const { coords, getCurrentPosition } = useGeolocation()
const { bathroomFormOpen, editingBathroom } = useAppModals()
const { uploadPhoto } = usePhotoUpload()
const { results: geocoderResults, search: geocoderSearch, clear: geocoderClear } = useGeocoder()
const toast = useToast()
const { t } = useI18n()

const loading = ref(false)
const photos = ref<File[]>([])
const locationQuery = ref('')
const showLocationResults = ref(true)
const miniMapContainer = ref<HTMLElement | null>(null)

let miniMap: any = null
let marker: any = null
let L: any = null

const isEditMode = computed(() => editingBathroom.value !== null)

const modalTitle = computed(() =>
  isEditMode.value
    ? t('bathroom.editBathroom')
    : t('bathroom.addBathroom'),
)

const submitLabel = computed(() =>
  isEditMode.value
    ? t('common.save')
    : t('bathroom.addBathroom'),
)

const form = reactive({
  name: '',
  type: 'public' as BathroomType,
  latitude: 0,
  longitude: 0,
  is_accessible: false,
  is_free: true,
  directions: '',
  schedule: '',
})

const typeOptions = computed(() => [
  { label: t('bathroom.types.public'), value: 'public' },
  { label: t('bathroom.types.restaurant'), value: 'restaurant' },
  { label: t('bathroom.types.gas_station'), value: 'gas_station' },
  { label: t('bathroom.types.mall'), value: 'mall' },
  { label: t('bathroom.types.cafe'), value: 'cafe' },
  { label: t('bathroom.types.hotel'), value: 'hotel' },
  { label: t('bathroom.types.hospital'), value: 'hospital' },
  { label: t('bathroom.types.other'), value: 'other' },
])

watch(locationQuery, (val) => {
  showLocationResults.value = true
  geocoderSearch(val)
})

const selectLocation = (result: GeocoderResult) => {
  showLocationResults.value = false
  locationQuery.value = result.displayName
  geocoderClear()
  setMarkerPosition(result.lat, result.lng)
  miniMap?.flyTo([result.lat, result.lng], 17)
}

const setMarkerPosition = (lat: number, lng: number) => {
  form.latitude = lat
  form.longitude = lng
  if (marker && L) {
    marker.setLatLng([lat, lng])
  }
}

const initMiniMap = async () => {
  if (!miniMapContainer.value || miniMap) return

  const leafletModule = await import('leaflet')
  L = leafletModule.default || leafletModule

  const center: [number, number] = form.latitude !== 0
    ? [form.latitude, form.longitude]
    : [40.4168, -3.7038]

  miniMap = L.map(miniMapContainer.value, {
    center,
    zoom: 15,
    zoomControl: true,
    attributionControl: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(miniMap)

  marker = L.marker(center, {
    icon: L.icon({
      iconUrl: '/markers/bathroom-marker.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    }),
  }).addTo(miniMap)

  miniMap.on('click', (e: any) => {
    setMarkerPosition(e.latlng.lat, e.latlng.lng)
  })

  // Auto-detect location
  const addUserLocation = (lat: number, lng: number) => {
    L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: '/markers/user-location.svg',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      interactive: false,
    }).addTo(miniMap)
    setMarkerPosition(lat, lng)
    miniMap.flyTo([lat, lng], 16)
  }

  if (coords.value) {
    addUserLocation(coords.value.lat, coords.value.lng)
  } else {
    getCurrentPosition()
    const stop = watch(coords, (c) => {
      if (c) {
        addUserLocation(c.lat, c.lng)
        stop()
      }
    })
  }
}

const destroyMiniMap = () => {
  if (miniMap) {
    miniMap.remove()
    miniMap = null
    marker = null
  }
}

const resetForm = () => {
  form.name = ''
  form.type = 'public'
  form.latitude = 0
  form.longitude = 0
  form.is_accessible = false
  form.is_free = true
  form.directions = ''
  form.schedule = ''
  locationQuery.value = ''
  photos.value = []
}

const fillFormFromEditing = () => {
  const b = editingBathroom.value
  if (!b) return
  form.name = b.name
  form.type = b.type
  form.latitude = b.latitude
  form.longitude = b.longitude
  form.is_accessible = b.is_accessible
  form.is_free = b.is_free
  form.directions = b.directions ?? ''
  form.schedule = b.schedule ?? ''
}

watch(bathroomFormOpen, (open) => {
  if (open) {
    if (isEditMode.value) {
      // Modo edit: pre-rellenar con los datos del baño y NO inicializar el mini mapa
      fillFormFromEditing()
    }
    else {
      // Modo create: inicializar mini mapa para elegir ubicación
      nextTick(() => {
        setTimeout(initMiniMap, 100)
      })
    }
  }
  else {
    destroyMiniMap()
    resetForm()
  }
})

const handleSubmit = async () => {
  if (!userId.value) return

  loading.value = true
  try {
    if (isEditMode.value && editingBathroom.value) {
      // Modo edit: solo actualizamos campos permitidos
      await updateBathroom(editingBathroom.value.id, {
        name: form.name,
        type: form.type,
        is_accessible: form.is_accessible,
        is_free: form.is_free,
        directions: form.directions || null,
        schedule: form.schedule || null,
      })
      // Refrescar el baño en el estado para que el modal de detalle vea los cambios
      await refreshBathroom(editingBathroom.value.id)
      toast.add({ title: t('common.success'), color: 'success' })
      bathroomFormOpen.value = false
      return
    }

    // Modo create
    if (form.latitude === 0 && form.longitude === 0) {
      toast.add({ title: t('bathroom.locationRequired'), color: 'error' })
      return
    }

    const bathroom = await createBathroom({
      ...form,
      directions: form.directions || undefined,
      schedule: form.schedule || undefined,
      created_by: userId.value,
    })
    for (const file of photos.value) {
      await uploadPhoto(file, { bathroomId: bathroom.id })
    }
    toast.add({ title: t('common.success'), color: 'success' })
    bathroomFormOpen.value = false
  }
  catch (err: any) {
    toast.add({ title: err.message, color: 'error' })
  }
  finally {
    loading.value = false
  }
}
</script>
