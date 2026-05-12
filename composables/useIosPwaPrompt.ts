/**
 * Detecta si el usuario está en iOS Safari y aún no ha instalado la PWA.
 * Muestra un banner una sola vez — al descartarlo se guarda en localStorage.
 */
export const useIosPwaPrompt = () => {
  const show = ref(false)

  onMounted(() => {
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true

    // localStorage puede lanzar en modo privado de iOS Safari (QuotaExceededError).
    let dismissed: string | null = null
    try {
      dismissed = localStorage.getItem('pwa-prompt-dismissed')
    } catch {
      // Sin acceso a storage → asumimos no dismissed; tampoco persistirá el dismiss
      // pero al menos no crasheamos la app al arrancar.
    }

    if (isIos && !isStandalone && !dismissed) {
      show.value = true
    }
  })

  const dismiss = () => {
    show.value = false
    try {
      localStorage.setItem('pwa-prompt-dismissed', '1')
    } catch {
      // Ignorar: modo privado iOS, storage lleno, etc. El banner queda oculto
      // en esta sesión aunque no podamos persistir.
    }
  }

  return { show, dismiss }
}
