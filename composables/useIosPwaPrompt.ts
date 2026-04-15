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
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')

    if (isIos && !isStandalone && !dismissed) {
      show.value = true
    }
  })

  const dismiss = () => {
    show.value = false
    localStorage.setItem('pwa-prompt-dismissed', '1')
  }

  return { show, dismiss }
}
