import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

const isUserCancel = (e: any) => {
  const msg = e?.message ?? ''
  return /cancel/i.test(msg) || /user denied/i.test(msg)
}

const webPathToFile = async (webPath: string, format?: string): Promise<File> => {
  const res = await fetch(webPath)
  const blob = await res.blob()
  const ext = format || 'jpeg'
  return new File([blob], `photo-${Date.now()}.${ext}`, { type: blob.type || `image/${ext}` })
}

export const usePhotoCapture = () => {
  const isNative = Capacitor.isNativePlatform()

  const takePhoto = async (): Promise<File | null> => {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
        quality: 80,
        allowEditing: false,
      })
      if (!photo.webPath) return null
      return await webPathToFile(photo.webPath, photo.format)
    }
    catch (e: any) {
      if (isUserCancel(e)) return null
      throw e
    }
  }

  const pickFromGallery = async (limit: number): Promise<File[]> => {
    try {
      const result = await Camera.pickImages({ quality: 80, limit })
      const files: File[] = []
      for (const photo of result.photos) {
        if (!photo.webPath) continue
        files.push(await webPathToFile(photo.webPath, photo.format))
      }
      return files
    }
    catch (e: any) {
      if (isUserCancel(e)) return []
      throw e
    }
  }

  const pickWithPrompt = async (): Promise<File | null> => {
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Prompt,
        resultType: CameraResultType.Uri,
        quality: 80,
        allowEditing: false,
      })
      if (!photo.webPath) return null
      return await webPathToFile(photo.webPath, photo.format)
    }
    catch (e: any) {
      if (isUserCancel(e)) return null
      throw e
    }
  }

  return { isNative, takePhoto, pickFromGallery, pickWithPrompt }
}
