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
  const share = async (options: ShareOptions): Promise<ShareResult> => {
    // Web Share API: disponible en mobile Safari y Chrome modernos.
    // Lanza el share sheet nativo del SO desde el navegador.
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      try {
        await (navigator as any).share(options)
        return 'shared'
      }
      catch (e: any) {
        if (isUserCancel(e)) return 'cancelled'
        // Cualquier otro error cae al fallback de clipboard.
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
