/**
 * Catálogo central de ciudades.
 * Compartido entre el script de seed (`scripts/seed-osm.ts`) y la página
 * dinámica de ciudad (`pages/city/[slug].vue`). Cualquier ciudad nueva debe
 * añadirse aquí — el seed y la página la recogen automáticamente.
 */

export interface City {
  /** Slug en kebab-case usado en la URL: `/city/<slug>` */
  slug: string
  /** Nombre legible para mostrar */
  name: string
  /** País legible para SEO y agrupado */
  country: string
  /** Bounding box [south, west, north, east] usado por Overpass y la página */
  bbox: [number, number, number, number]
}

/**
 * Convierte un nombre de ciudad a un slug kebab-case URL-safe:
 *   - "Madrid"             → "madrid"
 *   - "San Sebastián"      → "san-sebastian"
 *   - "Bali (Denpasar)"    → "bali-denpasar"
 *   - "Washington DC"      → "washington-dc"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export const CITIES: City[] = [
  // 🇪🇸 España
  { slug: 'madrid', name: 'Madrid', country: 'Spain', bbox: [40.31, -3.83, 40.55, -3.52] },
  { slug: 'barcelona', name: 'Barcelona', country: 'Spain', bbox: [41.32, 2.07, 41.47, 2.23] },
  { slug: 'valencia', name: 'Valencia', country: 'Spain', bbox: [39.42, -0.42, 39.52, -0.30] },
  { slug: 'sevilla', name: 'Sevilla', country: 'Spain', bbox: [37.32, -6.04, 37.43, -5.91] },
  { slug: 'bilbao', name: 'Bilbao', country: 'Spain', bbox: [43.22, -2.99, 43.30, -2.85] },
  { slug: 'malaga', name: 'Málaga', country: 'Spain', bbox: [36.66, -4.55, 36.78, -4.35] },
  { slug: 'zaragoza', name: 'Zaragoza', country: 'Spain', bbox: [41.60, -0.95, 41.72, -0.80] },
  { slug: 'palma-de-mallorca', name: 'Palma de Mallorca', country: 'Spain', bbox: [39.52, 2.59, 39.61, 2.72] },
  { slug: 'granada', name: 'Granada', country: 'Spain', bbox: [37.13, -3.65, 37.21, -3.55] },
  { slug: 'san-sebastian', name: 'San Sebastián', country: 'Spain', bbox: [43.28, -2.05, 43.34, -1.94] },

  // 🇲🇾 Malasia
  { slug: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', bbox: [3.05, 101.62, 3.23, 101.78] },
  { slug: 'penang', name: 'Penang', country: 'Malaysia', bbox: [5.35, 100.27, 5.45, 100.35] },

  // 🇪🇺 Europa Occidental
  { slug: 'london', name: 'London', country: 'United Kingdom', bbox: [51.43, -0.25, 51.57, 0.02] },
  { slug: 'paris', name: 'Paris', country: 'France', bbox: [48.81, 2.22, 48.90, 2.47] },
  { slug: 'berlin', name: 'Berlin', country: 'Germany', bbox: [52.42, 13.20, 52.59, 13.55] },
  { slug: 'amsterdam', name: 'Amsterdam', country: 'Netherlands', bbox: [52.32, 4.78, 52.43, 5.01] },
  { slug: 'rome', name: 'Rome', country: 'Italy', bbox: [41.78, 12.35, 41.99, 12.62] },
  { slug: 'lisbon', name: 'Lisbon', country: 'Portugal', bbox: [38.69, -9.23, 38.80, -9.09] },
  { slug: 'prague', name: 'Prague', country: 'Czech Republic', bbox: [50.00, 14.30, 50.13, 14.60] },
  { slug: 'dublin', name: 'Dublin', country: 'Ireland', bbox: [53.30, -6.40, 53.42, -6.10] },
  { slug: 'vienna', name: 'Vienna', country: 'Austria', bbox: [48.13, 16.18, 48.32, 16.58] },
  { slug: 'copenhagen', name: 'Copenhagen', country: 'Denmark', bbox: [55.61, 12.45, 55.73, 12.65] },

  // 🇪🇺 Europa (resto)
  { slug: 'athens', name: 'Athens', country: 'Greece', bbox: [37.93, 23.62, 38.04, 23.82] },
  { slug: 'budapest', name: 'Budapest', country: 'Hungary', bbox: [47.42, 18.97, 47.57, 19.20] },
  { slug: 'stockholm', name: 'Stockholm', country: 'Sweden', bbox: [59.25, 17.90, 59.43, 18.20] },
  { slug: 'oslo', name: 'Oslo', country: 'Norway', bbox: [59.85, 10.65, 59.98, 10.85] },
  { slug: 'helsinki', name: 'Helsinki', country: 'Finland', bbox: [60.13, 24.85, 60.25, 25.10] },
  { slug: 'warsaw', name: 'Warsaw', country: 'Poland', bbox: [52.15, 20.90, 52.35, 21.15] },
  { slug: 'brussels', name: 'Brussels', country: 'Belgium', bbox: [50.78, 4.27, 50.91, 4.47] },
  { slug: 'zurich', name: 'Zurich', country: 'Switzerland', bbox: [47.33, 8.47, 47.43, 8.63] },
  { slug: 'reykjavik', name: 'Reykjavik', country: 'Iceland', bbox: [64.11, -21.97, 64.17, -21.78] },
  { slug: 'edinburgh', name: 'Edinburgh', country: 'United Kingdom', bbox: [55.90, -3.30, 55.98, -3.08] },
  { slug: 'venice', name: 'Venice', country: 'Italy', bbox: [45.40, 12.25, 45.47, 12.42] },

  // 🇺🇸 USA
  { slug: 'new-york', name: 'New York', country: 'USA', bbox: [40.68, -74.05, 40.85, -73.85] },
  { slug: 'san-francisco', name: 'San Francisco', country: 'USA', bbox: [37.70, -122.52, 37.83, -122.35] },
  { slug: 'los-angeles', name: 'Los Angeles', country: 'USA', bbox: [33.93, -118.55, 34.24, -118.20] },
  { slug: 'chicago', name: 'Chicago', country: 'USA', bbox: [41.79, -87.83, 41.99, -87.55] },
  { slug: 'washington-dc', name: 'Washington DC', country: 'USA', bbox: [38.80, -77.12, 38.99, -76.92] },
  { slug: 'boston', name: 'Boston', country: 'USA', bbox: [42.23, -71.20, 42.40, -70.98] },
  { slug: 'miami', name: 'Miami', country: 'USA', bbox: [25.70, -80.30, 25.90, -80.12] },
  { slug: 'las-vegas', name: 'Las Vegas', country: 'USA', bbox: [36.08, -115.28, 36.25, -115.10] },
  { slug: 'seattle', name: 'Seattle', country: 'USA', bbox: [47.50, -122.45, 47.73, -122.23] },
  { slug: 'philadelphia', name: 'Philadelphia', country: 'USA', bbox: [39.87, -75.28, 40.07, -74.95] },
  { slug: 'orlando', name: 'Orlando', country: 'USA', bbox: [28.42, -81.48, 28.62, -81.28] },
  { slug: 'new-orleans', name: 'New Orleans', country: 'USA', bbox: [29.90, -90.14, 30.02, -89.95] },
  { slug: 'san-diego', name: 'San Diego', country: 'USA', bbox: [32.63, -117.27, 32.82, -117.10] },
  { slug: 'houston', name: 'Houston', country: 'USA', bbox: [29.55, -95.60, 29.90, -95.22] },
  { slug: 'austin', name: 'Austin', country: 'USA', bbox: [30.18, -97.85, 30.42, -97.60] },

  // 🇨🇦 Canadá
  { slug: 'toronto', name: 'Toronto', country: 'Canada', bbox: [43.58, -79.55, 43.85, -79.12] },
  { slug: 'montreal', name: 'Montreal', country: 'Canada', bbox: [45.40, -73.70, 45.60, -73.45] },
  { slug: 'vancouver', name: 'Vancouver', country: 'Canada', bbox: [49.20, -123.25, 49.32, -123.00] },
  { slug: 'ottawa', name: 'Ottawa', country: 'Canada', bbox: [45.35, -75.85, 45.48, -75.60] },
  { slug: 'quebec-city', name: 'Quebec City', country: 'Canada', bbox: [46.75, -71.30, 46.88, -71.15] },

  // 🌎 Latinoamérica
  { slug: 'mexico-city', name: 'Mexico City', country: 'Mexico', bbox: [19.30, -99.30, 19.55, -99.05] },
  { slug: 'havana', name: 'Havana', country: 'Cuba', bbox: [23.07, -82.42, 23.18, -82.30] },
  { slug: 'rio-de-janeiro', name: 'Rio de Janeiro', country: 'Brazil', bbox: [-22.98, -43.30, -22.85, -43.12] },
  { slug: 'lima', name: 'Lima', country: 'Peru', bbox: [-12.18, -77.10, -12.00, -76.95] },
  { slug: 'santiago', name: 'Santiago', country: 'Chile', bbox: [-33.52, -70.75, -33.35, -70.50] },
  { slug: 'buenos-aires', name: 'Buenos Aires', country: 'Argentina', bbox: [-34.70, -58.55, -34.53, -58.35] },

  // 🌏 Asia
  { slug: 'tokyo', name: 'Tokyo', country: 'Japan', bbox: [35.62, 139.65, 35.75, 139.85] },
  { slug: 'bangkok', name: 'Bangkok', country: 'Thailand', bbox: [13.68, 100.46, 13.85, 100.65] },
  { slug: 'singapore', name: 'Singapore', country: 'Singapore', bbox: [1.23, 103.60, 1.47, 104.00] },
  { slug: 'hong-kong', name: 'Hong Kong', country: 'China', bbox: [22.20, 114.10, 22.40, 114.30] },
  { slug: 'seoul', name: 'Seoul', country: 'South Korea', bbox: [37.45, 126.85, 37.65, 127.13] },
  { slug: 'taipei', name: 'Taipei', country: 'Taiwan', bbox: [25.00, 121.48, 25.13, 121.62] },
  { slug: 'beijing', name: 'Beijing', country: 'China', bbox: [39.78, 116.18, 40.05, 116.55] },
  { slug: 'shanghai', name: 'Shanghai', country: 'China', bbox: [31.13, 121.33, 31.35, 121.58] },
  { slug: 'delhi', name: 'Delhi', country: 'India', bbox: [28.48, 76.85, 28.78, 77.40] },
  { slug: 'mumbai', name: 'Mumbai', country: 'India', bbox: [18.88, 72.77, 19.23, 72.98] },
  { slug: 'jakarta', name: 'Jakarta', country: 'Indonesia', bbox: [-6.25, 106.70, -6.10, 106.92] },
  { slug: 'manila', name: 'Manila', country: 'Philippines', bbox: [14.55, 120.95, 14.68, 121.05] },
  { slug: 'hanoi', name: 'Hanoi', country: 'Vietnam', bbox: [20.98, 105.78, 21.08, 105.92] },
  { slug: 'bali-denpasar', name: 'Bali (Denpasar)', country: 'Indonesia', bbox: [-8.72, 115.15, -8.60, 115.30] },

  // 🌏 Oceanía
  { slug: 'sydney', name: 'Sydney', country: 'Australia', bbox: [-33.92, 151.15, -33.83, 151.30] },
  { slug: 'melbourne', name: 'Melbourne', country: 'Australia', bbox: [-37.85, 144.90, -37.78, 145.00] },

  // 🕌 Oriente Medio
  { slug: 'dubai', name: 'Dubai', country: 'United Arab Emirates', bbox: [25.10, 55.10, 25.30, 55.40] },
  { slug: 'tel-aviv', name: 'Tel Aviv', country: 'Israel', bbox: [32.03, 34.73, 32.13, 34.85] },
  { slug: 'doha', name: 'Doha', country: 'Qatar', bbox: [25.23, 51.45, 25.35, 51.58] },
  { slug: 'riyadh', name: 'Riyadh', country: 'Saudi Arabia', bbox: [24.58, 46.58, 24.80, 46.82] },

  // 🌍 África
  { slug: 'cape-town', name: 'Cape Town', country: 'South Africa', bbox: [-34.10, 18.30, -33.85, 18.55] },
  { slug: 'cairo', name: 'Cairo', country: 'Egypt', bbox: [29.95, 31.15, 30.15, 31.38] },
  { slug: 'marrakech', name: 'Marrakech', country: 'Morocco', bbox: [31.58, -8.05, 31.68, -7.92] },
  { slug: 'nairobi', name: 'Nairobi', country: 'Kenya', bbox: [-1.35, 36.70, -1.22, 36.92] },
  { slug: 'johannesburg', name: 'Johannesburg', country: 'South Africa', bbox: [-26.28, 27.95, -26.08, 28.12] },

  // 🌍 Euroasia
  { slug: 'istanbul', name: 'Istanbul', country: 'Turkey', bbox: [40.95, 28.85, 41.20, 29.15] },
]

/** Devuelve la ciudad cuyo slug coincida exactamente, o undefined */
export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find(c => c.slug === slug)
}

/**
 * Devuelve el centro [lat, lng] del bbox de una ciudad — útil para
 * inicializar el mapa centrado en la ciudad.
 */
export function getCityCenter(city: City): [number, number] {
  const [s, w, n, e] = city.bbox
  return [(s + n) / 2, (w + e) / 2]
}

/**
 * Mapeo ISO-3166-1 alpha-2 → nombre de país tal como aparece en CITIES.
 * Solo incluye los países que TENEMOS en CITIES (no es un mapeo exhaustivo).
 * Cuando se añade una ciudad nueva de un país nuevo, hay que añadir su código aquí.
 */
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  ES: 'Spain',
  MY: 'Malaysia',
  GB: 'United Kingdom',
  FR: 'France',
  DE: 'Germany',
  NL: 'Netherlands',
  IT: 'Italy',
  PT: 'Portugal',
  CZ: 'Czech Republic',
  IE: 'Ireland',
  AT: 'Austria',
  DK: 'Denmark',
  GR: 'Greece',
  HU: 'Hungary',
  SE: 'Sweden',
  NO: 'Norway',
  FI: 'Finland',
  PL: 'Poland',
  BE: 'Belgium',
  CH: 'Switzerland',
  IS: 'Iceland',
  US: 'USA',
  CA: 'Canada',
  MX: 'Mexico',
  CU: 'Cuba',
  BR: 'Brazil',
  PE: 'Peru',
  CL: 'Chile',
  AR: 'Argentina',
  JP: 'Japan',
  TH: 'Thailand',
  SG: 'Singapore',
  CN: 'China',
  HK: 'China', // Hong Kong devuelve HK pero está bajo China en CITIES
  KR: 'South Korea',
  TW: 'Taiwan',
  IN: 'India',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  AU: 'Australia',
  AE: 'United Arab Emirates',
  IL: 'Israel',
  QA: 'Qatar',
  SA: 'Saudi Arabia',
  ZA: 'South Africa',
  EG: 'Egypt',
  MA: 'Morocco',
  KE: 'Kenya',
  TR: 'Turkey',
}

/**
 * Dado un código de país (alpha-2), devuelve la primera ciudad que tenemos
 * en CITIES de ese país, o undefined si no hay match.
 *
 * Ejemplos:
 *   getCityForCountryCode('JP') → Tokyo
 *   getCityForCountryCode('ES') → Madrid (la primera de España en CITIES)
 *   getCityForCountryCode('XX') → undefined
 */
export function getCityForCountryCode(code: string): City | undefined {
  const country = COUNTRY_CODE_TO_NAME[code.toUpperCase()]
  if (!country) return undefined
  return CITIES.find(c => c.country === country)
}
