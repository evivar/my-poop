<template>
  <div class="space-y-2">
    <div v-if="previews.length > 0" class="flex gap-2 flex-wrap">
      <div v-for="(preview, i) in previews" :key="i" class="relative">
        <img :src="preview.url" class="w-20 h-20 object-cover rounded-lg border border-gray-700" />
        <button
          type="button"
          class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-xs text-gray-300 hover:bg-error-600 hover:text-white cursor-pointer transition-colors"
          @click="removeFile(i)"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="previews.length < maxPhotos">
      <div v-if="isNative" class="flex gap-2 flex-wrap">
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-sm text-gray-400"
          @click="onTakePhoto"
        >
          <UIcon name="i-heroicons-camera" />
          <span>{{ $t('photos.takePhoto') }}</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-sm text-gray-400"
          @click="onPickFromGallery"
        >
          <UIcon name="i-heroicons-photo" />
          <span>{{ $t('photos.chooseFromGallery') }}</span>
        </button>
      </div>

      <label
        v-else
        class="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-sm text-gray-400"
      >
        <UIcon name="i-heroicons-camera" />
        <span>{{ $t('photos.addPhoto') }}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          class="hidden"
          multiple
          @change="onFileSelect"
        />
      </label>
    </div>

    <p v-if="error" class="text-xs text-error-500">{{ error }}</p>
    <p v-if="validating" class="text-xs text-gray-400">{{ $t('photos.validating') }}</p>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  maxPhotos?: number
}>(), {
  maxPhotos: 2,
})

const files = defineModel<File[]>('files', { default: () => [] })

const { validateImage } = usePhotoUpload()
const { isNative, takePhoto, pickFromGallery } = usePhotoCapture()
const { t } = useI18n()

const previews = ref<{ url: string; file: File }[]>([])
const error = ref('')
const validating = ref(false)

const remainingSlots = computed(() => props.maxPhotos - previews.value.length)

const syncFiles = () => {
  files.value = previews.value.map(p => p.file)
}

const processFile = async (file: File): Promise<void> => {
  if (file.size > 5 * 1024 * 1024) {
    error.value = t('photos.tooLarge')
    return
  }

  validating.value = true
  const isValid = await validateImage(file)
  validating.value = false

  if (!isValid) {
    error.value = t('photos.rejected')
    return
  }

  previews.value.push({ url: URL.createObjectURL(file), file })
}

const onFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  error.value = ''

  const newFiles = Array.from(input.files).slice(0, remainingSlots.value)
  for (const file of newFiles) {
    await processFile(file)
  }

  syncFiles()
  input.value = ''
}

const onTakePhoto = async () => {
  error.value = ''
  try {
    const file = await takePhoto()
    if (!file) return
    await processFile(file)
    syncFiles()
  } catch {
    error.value = t('photos.cameraError')
  }
}

const onPickFromGallery = async () => {
  error.value = ''
  try {
    const newFiles = await pickFromGallery(remainingSlots.value)
    for (const file of newFiles) {
      if (previews.value.length >= props.maxPhotos) break
      await processFile(file)
    }
    syncFiles()
  } catch {
    error.value = t('photos.cameraError')
  }
}

const removeFile = (index: number) => {
  URL.revokeObjectURL(previews.value[index].url)
  previews.value.splice(index, 1)
  syncFiles()
}

onUnmounted(() => {
  previews.value.forEach(p => URL.revokeObjectURL(p.url))
})
</script>
