import { CITIES } from '~/utils/cities'
import { serverSupabaseClient } from '#supabase/server'
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async (event) => {
  // Páginas estáticas
  const staticUrls = [
    { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
    { loc: '/about', changefreq: 'monthly' as const, priority: 0.5 },
    { loc: '/privacy', changefreq: 'monthly' as const, priority: 0.3 },
  ]

  // City pages: alta prioridad, son landing pages SEO
  const cityUrls = CITIES.map(city => ({
    loc: `/city/${city.slug}`,
    changefreq: 'weekly' as const,
    priority: 0.9,
  }))

  // Bathroom pages: requiere Supabase. Si no hay credenciales (CI/Capacitor build),
  // devolvemos solo las URLs estáticas + ciudades sin fallar.
  let bathroomUrls: { loc: string, lastmod?: string }[] = []
  try {
    const supabase = await serverSupabaseClient(event)
    const PAGE_SIZE = 1000
    let from = 0
    while (true) {
      const { data } = await supabase
        .from('bathrooms')
        .select('id, updated_at')
        .range(from, from + PAGE_SIZE - 1)
      if (!data || data.length === 0) break
      for (const b of data) {
        bathroomUrls.push({
          loc: `/bathroom/${b.id}`,
          lastmod: b.updated_at,
        })
      }
      if (data.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }
  }
  catch {
    // Sin credenciales de Supabase (CI build para APK) — skip bathroom URLs
  }

  return [...staticUrls, ...cityUrls, ...bathroomUrls]
})
