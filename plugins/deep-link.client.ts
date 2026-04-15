import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

/**
 * Plugin client-only: escucha deep links en Android para manejar el
 * callback de OAuth. Soporta tanto el flujo implícito (hash con
 * access_token) como PKCE (query con code).
 */
export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const supabase = useSupabaseClient()

  App.addListener('appUrlOpen', async ({ url }) => {
    console.log('[deep-link] URL received:', url)

    // --- Flujo implícito: tokens en el hash fragment ---
    // URL: com.mypoop.app://confirm#access_token=xxx&refresh_token=xxx&...
    const hashIndex = url.indexOf('#')
    if (hashIndex !== -1) {
      const hashPart = url.substring(hashIndex + 1)
      const params = new URLSearchParams(hashPart)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        console.log('[deep-link] Implicit flow: setting session')
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) {
          console.error('[deep-link] setSession error:', error)
          return
        }
        reloadNuxtApp({ path: '/' })
        return
      }
    }

    // --- Flujo PKCE: code en los query params ---
    // URL: com.mypoop.app://confirm?code=xxx
    const queryIndex = url.indexOf('?')
    if (queryIndex !== -1) {
      const queryPart = url.substring(queryIndex + 1).split('#')[0]
      const params = new URLSearchParams(queryPart)
      const code = params.get('code')

      if (code) {
        console.log('[deep-link] PKCE flow: exchanging code for session')
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          console.error('[deep-link] exchangeCode error:', error)
          return
        }
        reloadNuxtApp({ path: '/' })
        return
      }
    }

    console.warn('[deep-link] URL received but no auth params found:', url)
  })
})
