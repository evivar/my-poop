import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

export type ShareOptions = {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

export type ShareResult = 'shared' | 'copied' | 'cancelled'

const isUserCancel = (e: any) => {
  const msg = e?.message ?? ''
  return /cancel/i.test(msg) || /abort/i.test(msg) || /share canceled/i.test(msg)
}

export const useShare = () => {
  const isNative = Capacitor.isNativePlatform()

  const share = async (options: ShareOptions): Promise<ShareResult> => {
    // Nativo: usar Capacitor Share para invocar el share sheet del SO
    if (isNative) {
      try {
        await Share.share(options)
        return 'shared'
      }
      catch (e: any) {
        if (isUserCancel(e)) return 'cancelled'
        throw e
      }
    }

    // Web Share API: disponible en mobile Safari y Chrome modernos.
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      try {
        await (navigator as any).share(options)
        return 'shared'
      }
      catch (e: any) {
        if (isUserCancel(e)) return 'cancelled'
      }
    }

    // Fallback: copiar al portapapeles.
    const fallbackText = [options.text, options.url].filter(Boolean).join('\n')
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fallbackText)
      return 'copied'
    }

    return 'cancelled'
  }

  return { share }
}
