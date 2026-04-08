import type { Photo } from '~/types'

let nsfwModel: any = null

export const usePhotoUpload = () => {
  const supabase = useSupabaseClient()
  const { userId } = useAuth()

  const loadNsfwModel = async () => {
    if (nsfwModel) return nsfwModel
    const nsfwjs = await import('nsfwjs')
    nsfwModel = await nsfwjs.load()
    return nsfwModel
  }

  const validateImage = async (file: File): Promise<boolean> => {
    const model = await loadNsfwModel()
    const img = document.createElement('img')
    const url = URL.createObjectURL(file)

    return new Promise((resolve) => {
      img.onload = async () => {
        const predictions = await model.classify(img)
        URL.revokeObjectURL(url)
        const porn = predictions.find((p: any) => p.className === 'Porn')?.probability ?? 0
        const hentai = predictions.find((p: any) => p.className === 'Hentai')?.probability ?? 0
        resolve(porn < 0.3 && hentai < 0.3)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(false)
      }
      img.src = url
    })
  }

  const uploadPhoto = async (file: File, target: { bathroomId?: string; reviewId?: string }): Promise<Photo> => {
    if (!userId.value) throw new Error('Not authenticated')

    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'jpg'
    const folder = target.reviewId ? 'reviews' : 'bathrooms'
    const parentId = target.reviewId || target.bathroomId
    const path = `${userId.value}/${folder}/${parentId}/${timestamp}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, file, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data, error: insertError } = await supabase
      .from('photos')
      .insert({
        bathroom_id: target.bathroomId || null,
        review_id: target.reviewId || null,
        uploaded_by: userId.value,
        storage_path: path,
      })
      .select()
      .single()

    if (insertError) throw insertError
    return data as Photo
  }

  const getPhotoUrl = (storagePath: string): string => {
    const { data } = supabase.storage.from('photos').getPublicUrl(storagePath)
    return data.publicUrl
  }

  const fetchPhotosForBathroom = async (bathroomId: string): Promise<Photo[]> => {
    // Get direct bathroom photos
    const { data: bathroomPhotos } = await supabase
      .from('photos')
      .select('*')
      .eq('bathroom_id', bathroomId)

    // Get review IDs for this bathroom
    const { data: reviews } = await supabase
      .from('reviews')
      .select('id')
      .eq('bathroom_id', bathroomId)
      .eq('is_hidden', false)

    let reviewPhotos: Photo[] = []
    const reviewIds = (reviews ?? []).map(r => r.id)
    if (reviewIds.length > 0) {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .in('review_id', reviewIds)
      reviewPhotos = (data ?? []) as Photo[]
    }

    return [...(bathroomPhotos ?? []) as Photo[], ...reviewPhotos]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  const fetchDirectBathroomPhotoCount = async (bathroomId: string): Promise<number> => {
    const { count } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('bathroom_id', bathroomId)
    return count ?? 0
  }

  const deletePhoto = async (photoId: string, storagePath: string) => {
    await supabase.storage.from('photos').remove([storagePath])
    await supabase.from('photos').delete().eq('id', photoId)
  }

  return { validateImage, uploadPhoto, getPhotoUrl, fetchPhotosForBathroom, fetchDirectBathroomPhotoCount, deletePhoto }
}
