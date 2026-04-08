import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { Database } from '../types/database.types'
import { type City, CITIES } from '../utils/cities'

config()

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// Alias del shape de ciudad usado por el script. CITIES viene de utils/cities.ts
// para que tanto el seed como pages/city/[slug].vue compartan la misma fuente.
type CitySeed = Pick<City, 'name' | 'bbox'>

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

type BathroomInsert = Database['public']['Tables']['bathrooms']['Insert']

// Mirrors de Overpass — si el principal está saturado (504), probamos los siguientes
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

async function fetchOSMToilets(bbox: CitySeed['bbox']) {
  const [s, w, n, e] = bbox
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"="toilets"](${s},${w},${n},${e});
      way["amenity"="toilets"](${s},${w},${n},${e});
      relation["amenity"="toilets"](${s},${w},${n},${e});
    );
    out center tags;
  `

  let lastError: string = ''
  for (const endpoint of OVERPASS_ENDPOINTS) {
    // 90s timeout por mirror — la query lleva [timeout:60] pero dejamos margen de red
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 90_000)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'my-poop-seed/1.0 (https://github.com/ernestovivar/my-poop)',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: controller.signal,
      })

      if (!response.ok) {
        lastError = `${endpoint} → HTTP ${response.status}`
        console.warn(`  ⚠ ${lastError}, trying next mirror...`)
        continue
      }

      const data = await response.json() as { elements: OverpassElement[] }
      return data.elements
    }
    catch (e: any) {
      lastError = e.name === 'AbortError'
        ? `${endpoint} → timeout after 90s`
        : `${endpoint} → ${e.message}`
      console.warn(`  ⚠ ${lastError}, trying next mirror...`)
    }
    finally {
      clearTimeout(timer)
    }
  }

  throw new Error(`All Overpass mirrors failed. Last error: ${lastError}`)
}

function mapElement(el: OverpassElement): BathroomInsert | null {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (lat == null || lng == null) return null

  const tags = el.tags ?? {}

  // Filtros de descarte
  if (tags.access === 'private') return null
  if (tags['disused:amenity'] === 'toilets') return null
  if (tags.fixme === 'duplicate') return null

  return {
    osm_id: `${el.type}/${el.id}`,
    source: 'osm',
    name: tags.name ?? 'Public toilet',
    type: 'public',
    latitude: lat,
    longitude: lng,
    location: `POINT(${lng} ${lat})`,
    is_accessible: tags.wheelchair === 'yes',
    is_free: tags.fee === 'no',
    schedule: tags.opening_hours ?? null,
    directions: tags.description ?? null,
    created_by: null,
  }
}

async function seedCity(city: CitySeed) {
  console.log(`\n→ Seeding ${city.name}...`)
  const elements = await fetchOSMToilets(city.bbox)
  console.log(`  Overpass returned ${elements.length} elements`)

  const bathrooms = elements
    .map(mapElement)
    .filter((b): b is BathroomInsert => b !== null)
  console.log(`  ${bathrooms.length} valid after filtering`)

  if (bathrooms.length === 0) return

  // Upsert en lotes de 100 para no saturar Postgres
  const BATCH = 100
  let inserted = 0
  let skipped = 0
  for (let i = 0; i < bathrooms.length; i += BATCH) {
    const batch = bathrooms.slice(i, i + BATCH)

    // Filtrar baños cuyo osm_id ya tiene user_edited=true.
    // Estos los ha editado un usuario y no queremos pisotear sus cambios.
    const osmIds = batch.map(b => b.osm_id!).filter(Boolean)
    const { data: editedRows, error: editedError } = await supabase
      .from('bathrooms')
      .select('osm_id')
      .eq('source', 'osm')
      .eq('user_edited', true)
      .in('osm_id', osmIds)

    if (editedError) {
      console.error(`  ⚠ Failed to check user_edited for batch ${i / BATCH + 1}:`, editedError.message)
    }

    const editedSet = new Set((editedRows ?? []).map(r => r.osm_id!))
    const toUpsert = batch.filter(b => !editedSet.has(b.osm_id!))
    skipped += batch.length - toUpsert.length

    if (toUpsert.length === 0) continue

    const { error, count } = await supabase
      .from('bathrooms')
      .upsert(toUpsert, {
        onConflict: 'osm_id',
        ignoreDuplicates: false,
        count: 'exact',
      })

    if (error) {
      console.error(`  ❌ Batch ${i / BATCH + 1} failed:`, error.message)
      continue
    }
    inserted += count ?? toUpsert.length
  }

  const skippedNote = skipped > 0 ? ` (${skipped} skipped: user_edited)` : ''
  console.log(`  ✅ Upserted ${inserted} bathrooms in ${city.name}${skippedNote}`)
}

async function main() {
  const target = process.argv[2]
  const cities = target
    ? CITIES.filter(c => c.name.toLowerCase() === target.toLowerCase())
    : CITIES

  if (cities.length === 0) {
    console.error(`No city matches "${target}"`)
    process.exit(1)
  }

  for (const city of cities) {
    try {
      await seedCity(city)
    }
    catch (e: any) {
      console.error(`❌ ${city.name} failed:`, e.message)
    }
    // Cortesía con Overpass: 5s entre ciudades
    await new Promise(r => setTimeout(r, 5000))
  }

  console.log('\n✨ Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
