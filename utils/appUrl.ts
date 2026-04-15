/**
 * URL base pública de la app. En el WebView de Capacitor,
 * window.location.origin es "https://localhost" (sin puerto).
 * En npm run dev es "http://localhost:3000" (con puerto).
 * En producción es la URL real de Vercel.
 *
 * Función (no const) para que se evalúe en el momento de uso,
 * no al importar el módulo.
 */
export function getAppUrl(): string {
  if (typeof window === 'undefined') return 'https://my-poop.vercel.app'
  // Capacitor WebView: https://localhost (sin puerto)
  if (window.location.origin === 'https://localhost') {
    return 'https://my-poop.vercel.app'
  }
  return window.location.origin
}
