/**
 * Server-side plugin: lee el código de país del usuario desde headers
 * inyectados por el edge del hosting (Vercel o Cloudflare) y lo guarda en
 * useState('userCountry') para que el cliente pueda usarlo en la
 * hidratación inicial (p.ej. centrar el mapa en su país en vez de Madrid).
 *
 * En local dev no hay estos headers, así que userCountry queda null y el
 * mapa cae al fallback Madrid (comportamiento previo).
 */
export default defineNuxtPlugin(() => {
  const country = useState<string | null>('userCountry', () => null)
  const headers = useRequestHeaders(['x-vercel-ip-country', 'cf-ipcountry'])
  const code = headers['x-vercel-ip-country'] || headers['cf-ipcountry']
  if (code) {
    country.value = code.toUpperCase()
  }
})
