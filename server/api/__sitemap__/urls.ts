import { CITIES } from '~/utils/cities'
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(() => {
  const staticUrls = [
    { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
    { loc: '/about', changefreq: 'monthly' as const, priority: 0.5 },
    { loc: '/privacy', changefreq: 'monthly' as const, priority: 0.3 },
  ]

  const cityUrls = CITIES.map(city => ({
    loc: `/city/${city.slug}`,
    changefreq: 'weekly' as const,
    priority: 0.9,
  }))

  return [...staticUrls, ...cityUrls]
})
