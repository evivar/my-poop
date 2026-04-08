# My Poop — Plan técnico pre-lanzamiento

Plan detallado de las mejoras técnicas necesarias antes de postear en Reddit.
Acompaña a `MY_POOP_RELEASE_PLAN.md` (estrategia de marketing) — este documento es **el código que hay que escribir**.

**Objetivo:** llegar al primer post de Reddit con una app que (a) no esté vacía, (b) no tenga fricción de instalación, (c) sobreviva a los trolls, (d) sea medible, y (e) tenga tracción orgánica de medio plazo.

---

## Tabla de prioridades

| # | Tarea | Esfuerzo | Bloquea Reddit | Impacto |
|---|---|---|---|---|
| 1 | Seed OSM | ~3-4h | SÍ | 🔥🔥🔥 |
| 2 | Edición de baños OSM por usuarios | ~2-3h | SÍ | 🔥🔥🔥 |
| 3 | Páginas de ciudad | ~2-3h | SÍ | 🔥🔥🔥 |
| 4 | PWA | ~30-60min | SÍ | 🔥🔥 |
| 5 | Auditoría cold start sin geolocalización | ~30min | SÍ | 🔥🔥 |
| 6 | Rate limiting RLS | ~15min | SÍ | 🔥🔥 |
| 7 | Vercel Analytics | ~5min | SÍ | 🔥 |
| 8 | Reportes anónimos still-here/closed | ~2-3h | NO | 🔥🔥 |
| 9 | Página About + GitHub link | ~30min | NO | 🔥🔥 |
| 10 | Privacy Policy mínima | ~30min | NO | 🔥 |
| 11 | Email "tu baño tiene actividad" | ~2h | NO | 🔥🔥🔥 (retención) |
| 12 | Sitemap + Search Console | ~30min | NO | 🔥🔥 (medio plazo) |
| 13 | OG image dinámica por baño | ~1-2h | NO | 🔥 |
| 14 | Screenshots + video del flujo SOS | ~1h | SÍ (para el post) | 🔥🔥🔥 |

**Total estimado:** ~18-23h. Las 7 primeras son **non-negotiable** para postear.

---

## 1. Seed OSM — el corazón del lanzamiento

### Por qué es la mejora #1

El problema clásico de toda app crowdsourced: el día 1 el mapa está vacío en cualquier ciudad donde no hayas añadido cosas tú a mano. Usuario abre, ve cero baños, cierra, no vuelve. Sin datos no hay valor, sin valor no hay reseñas, sin reseñas no hay datos. Círculo de la muerte.

**Solución:** OpenStreetMap tiene **decenas de miles de baños públicos** ya etiquetados como `amenity=toilets`, con coordenadas, accesibilidad, gratis/pago, horarios. Es libre, la API es gratuita, los datos son CC-BY-SA (compatible con uso comercial atribuyendo).

### Qué API usaremos: Overpass

Overpass es el motor de queries de OSM. Endpoint público gratuito en `https://overpass-api.de/api/interpreter`. Acepta queries en Overpass QL (un lenguaje propio simple), devuelve JSON.

**Query base que usaremos:**

```
[out:json][timeout:60];
(
  node["amenity"="toilets"](40.31,-3.83,40.55,-3.52);
  way["amenity"="toilets"](40.31,-3.83,40.55,-3.52);
  relation["amenity"="toilets"](40.31,-3.83,40.55,-3.52);
);
out center tags;
```

**Cómo leerla:**

- `[out:json]` → output en JSON
- `[timeout:60]` → 60 segundos máximo (Overpass es público y a veces va lento)
- `node|way|relation` → buscamos los tres tipos de elementos OSM porque un baño puede estar como punto (`node`), como polígono (`way`, p.ej. dentro de un edificio) o como relación (raro pero existe)
- `["amenity"="toilets"]` → el filtro: solo baños
- `(40.31,-3.83,40.55,-3.52)` → bounding box: `(south, west, north, east)` en grados decimales. Esto es Madrid.
- `out center tags` → devuelve el centroide (importante para `way`/`relation` que no son puntos) más todos los tags del elemento

### Tags OSM relevantes y cómo mapearlos a nuestro schema

OSM tiene cientos de tags posibles. Estos son los que importan:

| Tag OSM | Valor típico | Mapeo a `bathrooms` |
|---|---|---|
| `name` | "Aseos Plaza Mayor" | `name` (fallback: "Public toilet") |
| `wheelchair` | `yes`/`no`/`limited` | `is_accessible = wheelchair === 'yes'` |
| `fee` | `yes`/`no` | `is_free = fee === 'no'` (default `false` si desconocido) |
| `opening_hours` | `Mo-Su 08:00-22:00` | `schedule` (string tal cual) |
| `description` | texto libre | `directions` (string tal cual, o ignorar) |
| `access` | `yes`/`customers`/`private` | **Si `private`, descartar** (no es público) |
| `disused:amenity` | `toilets` | **Si existe, descartar** (ya no funciona) |
| `unisex` | `yes`/`no` | (ignorar por ahora) |
| `changing_table` | `yes`/`no` | (ignorar por ahora) |
| `operator` | "Ayuntamiento" | (ignorar por ahora) |

**Decisiones importantes sobre el mapeo:**

1. **`type` (público/restaurante/etc.)** — Para baños de OSM ponemos `type = 'public'` para todos. Los demás tipos (restaurant, mall, etc.) no se pueden inferir fiablemente desde OSM y los usuarios pueden recategorizar después. Mantener simple.

2. **`is_free` por defecto `false` si no hay tag `fee`** — Mejor pecar de "no sabemos si es gratis" que decir "es gratis" y que el usuario llegue y le cobren. Solo `fee=no` explícito → `is_free=true`.

3. **`is_accessible` por defecto `false` si no hay tag `wheelchair`** — Misma lógica de seguridad. Usuario en silla no debe llegar y encontrar escaleras.

4. **`name` fallback** — Si no hay name, usamos `"Public toilet"`. En el futuro podemos enriquecer con el nombre de la calle más cercana via reverse geocoding (Photon/Nominatim), pero v1 mantiene simple.

5. **Filtros de descarte:**
   - `access=private` → descartar (no es público)
   - `disused:amenity=toilets` → descartar (ya no existe)
   - Sin `lat`/`lng` → descartar (corrupto)
   - Tag `fixme` con valor "duplicate" → descartar (duplicado conocido en OSM)

### Cambios en el schema de Supabase

Necesitamos dos columnas nuevas para hacer el seed idempotente y poder distinguir baños OSM de baños de usuarios.

**Migración SQL:**

```sql
-- 1. Añadir columnas de origen y tracking OSM
alter table bathrooms
  add column osm_id text,
  add column source text not null default 'user';

-- 2. Constraint para asegurar valores válidos en source
alter table bathrooms
  add constraint bathrooms_source_check
  check (source in ('user', 'osm'));

-- 3. Unique sobre osm_id (parcial: solo cuando no es null)
create unique index bathrooms_osm_id_unique
  on bathrooms(osm_id)
  where osm_id is not null;

-- 4. Index para filtrar por source rápido (útil en stats y filters)
create index bathrooms_source_idx on bathrooms(source);
```

**Verificaciones antes de correr la migración:**

- ✅ `created_by` ya es nullable (verificado en `types/database.types.ts`) — perfecto, los baños OSM tendrán `created_by = null`
- ⚠️ Verificar que las RLS policies de UPDATE/DELETE no rompen cuando `created_by IS NULL`. Probablemente la policy es algo tipo `auth.uid() = created_by`, lo cual con `null` simplemente no permite editar — eso es deseable: nadie puede editar un baño OSM directamente excepto añadiéndole reviews/fotos
- ⚠️ Si quieres permitir a admins editarlos, añadir una policy aparte basada en rol

**Regenerar tipos después:**

```bash
npx supabase gen types typescript --project-id <id> > types/database.types.ts
```

### Arquitectura del script

**Ubicación:** `scripts/seed-osm.ts` (carpeta nueva en root, no dentro de `server/` porque no es runtime de Nuxt).

**Cómo se ejecuta:** localmente desde tu máquina, una sola vez por ciudad. Lee `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` desde `.env`. **Importante:** usa el service role key porque el script bypasea RLS para insertar masivamente. Nunca exponer este key al cliente.

**Estructura del script:**

```ts
// scripts/seed-osm.ts
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import type { Database } from '../types/database.types'

config()

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface CitySeed {
  name: string
  // [south, west, north, east]
  bbox: [number, number, number, number]
}

const CITIES: CitySeed[] = [
  // España (no negociables)
  { name: 'Madrid',     bbox: [40.31, -3.83, 40.55, -3.52] },
  { name: 'Barcelona',  bbox: [41.32,  2.07, 41.47,  2.23] },
  { name: 'Valencia',   bbox: [39.42, -0.42, 39.52, -0.30] },
  { name: 'Sevilla',    bbox: [37.32, -6.04, 37.43, -5.91] },
  { name: 'Bilbao',     bbox: [43.22, -2.99, 43.30, -2.85] },

  // Malasia (donde vives)
  { name: 'Kuala Lumpur', bbox: [3.05, 101.62, 3.23, 101.78] },
  { name: 'Penang',       bbox: [5.35, 100.27, 5.45, 100.35] },

  // Top global para los posts internacionales
  { name: 'London',     bbox: [51.43, -0.25, 51.57,  0.02] },
  { name: 'Paris',      bbox: [48.81,  2.22, 48.90,  2.47] },
  { name: 'Berlin',     bbox: [52.42, 13.20, 52.59, 13.55] },
  { name: 'New York',   bbox: [40.68, -74.05, 40.85, -73.85] },
  { name: 'Tokyo',      bbox: [35.62, 139.65, 35.75, 139.85] },
  { name: 'Bangkok',    bbox: [13.68, 100.46, 13.85, 100.65] },
  { name: 'Singapore',  bbox: [1.23, 103.60, 1.47, 104.00] },
]

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

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

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  })

  if (!response.ok) {
    throw new Error(`Overpass HTTP ${response.status}: ${await response.text()}`)
  }

  const data = await response.json() as { elements: OverpassElement[] }
  return data.elements
}

function mapElement(el: OverpassElement) {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (!lat || !lng) return null

  const tags = el.tags ?? {}

  // Filtros de descarte
  if (tags.access === 'private') return null
  if (tags['disused:amenity'] === 'toilets') return null
  if (tags.fixme === 'duplicate') return null

  return {
    osm_id: `${el.type}/${el.id}`,
    source: 'osm' as const,
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

  const bathrooms = elements.map(mapElement).filter(Boolean)
  console.log(`  ${bathrooms.length} valid after filtering`)

  if (bathrooms.length === 0) return

  // Upsert en lotes de 100 para no saturar Postgres
  const BATCH = 100
  let inserted = 0
  for (let i = 0; i < bathrooms.length; i += BATCH) {
    const batch = bathrooms.slice(i, i + BATCH)
    const { error, count } = await supabase
      .from('bathrooms')
      .upsert(batch, {
        onConflict: 'osm_id',
        ignoreDuplicates: false,
        count: 'exact',
      })

    if (error) {
      console.error(`  ❌ Batch ${i / BATCH + 1} failed:`, error.message)
      continue
    }
    inserted += count ?? batch.length
  }

  console.log(`  ✅ Upserted ${inserted} bathrooms in ${city.name}`)
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
    } catch (e: any) {
      console.error(`❌ ${city.name} failed:`, e.message)
    }
    // Cortesía con Overpass: 5s entre ciudades
    await new Promise(r => setTimeout(r, 5000))
  }

  console.log('\n✨ Done')
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
```

### Cómo correrlo

1. **Añadir dependencias:**
   ```bash
   npm install -D dotenv tsx
   ```

2. **Crear `.env` (si no existe ya) con:**
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   ```
   ⚠️ Verificar que `.env` está en `.gitignore`. **El service role key da acceso total a la DB, NUNCA debe subirse al repo ni al cliente.**

3. **Añadir script en `package.json`:**
   ```json
   "scripts": {
     "seed:osm": "tsx scripts/seed-osm.ts"
   }
   ```

4. **Ejecutar:**
   ```bash
   # Todas las ciudades de la lista
   npm run seed:osm

   # Una sola ciudad (para tests rápidos)
   npm run seed:osm madrid
   npm run seed:osm "Kuala Lumpur"
   ```

5. **Volver a correrlo cuantas veces quieras** — la unicidad de `osm_id` hace upsert idempotente. Si OSM cambió un baño (ej. cambió el name), el upsert lo actualiza. Si añadieron baños nuevos, los inserta. Si borraron alguno... ahí tendríamos un problema (huérfanos), pero para v1 lo dejamos. Más adelante se puede añadir un "soft delete" comparando `osm_id`s presentes vs. ausentes.

### Cosas a verificar después del primer seed

- **Cuántos baños tiene Madrid?** Debería estar entre 200-800. Si es < 50 algo va mal en el bbox o el query. Si es > 2000 puede que el bbox sea demasiado grande.
- **Abrir el mapa en `localhost:3000` y ver** que aparecen baños en Madrid sin meter ninguno a mano.
- **Hacer click en uno de OSM:** ¿se abre el `BathroomDetailModal`? ¿muestra el nombre? ¿el horario? ¿el botón de añadir review funciona aunque `created_by` sea null?
- **Verificar que NO se puede editar/borrar** un baño OSM desde la UI (porque RLS bloquea cuando `created_by` es null).
- **Intentar añadir una review a un baño OSM** — debe funcionar normal, las reviews no dependen de quién creó el baño.

### Mejoras opcionales del seed (para más adelante)

- **Re-seed periódico:** cron mensual desde GitHub Actions o Supabase Edge Function que vuelve a correr el seed para sincronizar cambios de OSM
- **Reverse geocoding del nombre:** si el baño no tiene name, ponerle "Toilet near [calle más cercana]" usando Photon
- **Soft delete:** marcar como `unverified` los baños cuyo `osm_id` ya no aparece en OSM
- **Más tags:** mapear `changing_table` (cambiador), `unisex`, `male`/`female`, `toilets:disposal`
- **Más ciudades:** expandir la lista hasta cubrir la mayoría de capitales y ciudades grandes globales

### Badge "Importado de OSM" en el UI

Para que los usuarios entiendan que estos baños son seeds y se animen a contribuir:

En `BathroomDetailModal.vue`, cerca del nombre, mostrar un pequeño badge si `bathroom.source === 'osm'`:

```vue
<UBadge v-if="bathroom.source === 'osm'" color="neutral" variant="subtle" size="xs">
  {{ $t('bathroom.imported_from_osm') }}
</UBadge>
```

Y en las traducciones:
```json
// en.json
"bathroom.imported_from_osm": "From OpenStreetMap — help by adding a review or photo"
// es.json
"bathroom.imported_from_osm": "De OpenStreetMap — ayuda añadiendo una reseña o foto"
```

Esto convierte el seed pasivo en una invitación activa a contribuir. Es **el** detalle psicológico que diferencia "mapa lleno y muerto" de "mapa lleno con stubs que pide colaboración".

---

## 2. Edición de baños OSM por usuarios

### Por qué

Los baños importados de OSM vienen con datos mínimos: nombre genérico (`"Public toilet"`), sin horario, `is_free=false` por defecto (defensivo), `is_accessible=false` por defecto. Sin la posibilidad de corregirlo, la primera queja en Reddit será **"vuestro mapa tiene info equivocada y no puedo arreglarla"**.

Permitir que los usuarios autenticados editen estos baños:

1. **Mejor UX inmediato** — el usuario que ve "Public toilet" sin horario y conoce el sitio puede arreglarlo en 30 segundos
2. **Mejor dataset con el tiempo** — la calidad de los datos OSM es a menudo mediocre fuera de Europa
3. **Engagement** — convierte usuarios pasivos (solo reviews) en contribuidores activos
4. **Diferenciador vs OSM** — somos una capa enriquecida sobre OSM, no un mero clon

### Qué se puede editar y qué NO

| Campo | Editable | Por qué |
|---|---|---|
| `name` | ✅ | Mejorar nombres genéricos |
| `type` | ✅ | Recategorizar (mall, restaurante, etc.) |
| `is_free` | ✅ | Verificación in-situ |
| `is_accessible` | ✅ | Verificación in-situ |
| `schedule` | ✅ | Añadir horario que OSM no tenía |
| `directions` | ✅ | Mejorar instrucciones de acceso |
| `latitude` / `longitude` | ❌ | Anti-vandalismo. Si el baño está mal ubicado, mejor reportarlo |
| `osm_id`, `source`, `created_by` | ❌ | Sistema |
| `avg_rating`, `review_count` | ❌ | Calculados |

### Cambios de schema

```sql
-- Flag que marca si un usuario ya ha editado este baño OSM.
-- Sirve para que el seed re-run no pisotee ediciones humanas.
alter table bathrooms
  add column user_edited boolean not null default false;
```

No guardamos `last_edited_by` ni `last_edited_at` en v1 — mantener simple. Si en el futuro queremos audit log, lo añadimos en una tabla aparte (`bathroom_edits`).

### RLS policy nueva

```sql
-- Authenticated non-banned users pueden actualizar baños OSM
create policy bathrooms_update_osm_authenticated
  on bathrooms
  for update
  to authenticated
  using (
    source = 'osm'
    and not exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.is_banned = true
    )
  )
  with check (
    source = 'osm'
  );
```

### Trigger anti-tampering (campos no editables)

PostgreSQL no permite restringir columnas concretas en RLS, así que para garantizar que el cliente no puede tocar `latitude/longitude`, ratings, etc., usamos un trigger BEFORE UPDATE que compara OLD y NEW:

```sql
create or replace function prevent_osm_locked_field_updates()
returns trigger as $$
begin
  if old.source = 'osm' and (
    new.latitude is distinct from old.latitude
    or new.longitude is distinct from old.longitude
    or new.location is distinct from old.location
    or new.osm_id is distinct from old.osm_id
    or new.source is distinct from old.source
    or new.created_by is distinct from old.created_by
    or new.avg_rating is distinct from old.avg_rating
    or new.avg_cleanliness is distinct from old.avg_cleanliness
    or new.avg_privacy is distinct from old.avg_privacy
    or new.avg_toilet_paper_quality is distinct from old.avg_toilet_paper_quality
    or new.review_count is distinct from old.review_count
  ) then
    -- Permitir si es admin (la policy bathrooms_update_admin lo cubre)
    if not exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    ) then
      raise exception 'Cannot modify locked fields on OSM bathroom';
    end if;
  end if;
  -- Marcar como editado por usuario (idempotente)
  if old.source = 'osm' and not old.user_edited then
    new.user_edited := true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger bathrooms_prevent_osm_locked_updates
  before update on bathrooms
  for each row
  execute function prevent_osm_locked_field_updates();
```

### Cambio en el seed script

En `scripts/seed-osm.ts`, antes del upsert, filtrar los `osm_id` que ya tengan `user_edited = true` para no pisotear ediciones humanas en futuros re-seeds:

```ts
// Antes de upsert, comprobar qué osm_ids ya están user_edited
const osmIds = batch.map(b => b.osm_id!).filter(Boolean)
const { data: editedRows } = await supabase
  .from('bathrooms')
  .select('osm_id')
  .eq('source', 'osm')
  .eq('user_edited', true)
  .in('osm_id', osmIds)

const editedSet = new Set(editedRows?.map(r => r.osm_id) ?? [])
const toUpsert = batch.filter(b => !editedSet.has(b.osm_id))

if (toUpsert.length === 0) continue
```

### Cambios en UI

1. **Botón Edit en `BathroomDetailModal`** — visible solo si:
   - usuario está autenticado
   - `bathroom.source === 'osm'`
   - (los baños user-created tendrán su propio flujo aparte si llega el caso)

2. **Reusar `BathroomForm.vue` en modo edit** — añadir prop `editingBathroom: Bathroom | null`. Si está presente, pre-rellena valores y al submit hace `update` en lugar de `insert`. Para baños OSM, el form **oculta** los campos `latitude/longitude` (no editables).

3. **Badge actualizado** en el modal:
   - `user_edited === false` → `"Imported from OSM"` (gris neutral)
   - `user_edited === true` → `"Imported from OSM · Verified"` (verde) o badge separado `"Verified"`

4. **Mensaje sutil de invitación** cuando el baño aún no está verificado:
   ```
   "This bathroom was imported from OpenStreetMap. Help improve it!"
   ```

### Anti-vandalismo (mínimo viable v1)

- **Coordenadas no editables** — el mayor vector de vandalismo eliminado de raíz
- **Rate limiting** (vía Fase 6, antes Fase 5): max 10 ediciones de baños OSM por usuario por hora
- **Reusar sistema de `reports`** — si una edición es sospechosa, otros usuarios pueden reportarla
- **Trigger SQL** que bloquea cambios en columnas locked (ratings, location, etc.)

### Esfuerzo

~2-3h:
- Migración SQL (`user_edited` + RLS policy + trigger): 30min
- Update `scripts/seed-osm.ts` para respetar `user_edited`: 15min
- `BathroomForm.vue` en modo edit: 45min
- Botón + lógica en `BathroomDetailModal`: 30min
- Badge "Verified" + i18n: 15min
- Testing manual + Playwright: 30min

### Bloquea Reddit

**SÍ.** Sin esto, los usuarios verán muchos baños con "Public toilet" como nombre y los datos por defecto, y es la primera queja que vendrá en los comentarios del post. Es la diferencia entre "esta app es un wrapper de OSM" y "esta app mejora OSM con la comunidad".

---

## 3. Páginas de ciudad — `/city/[slug]`

### Por qué

Sin esto, los links que metas en cada post de Reddit son todos a `mypoop.app` (genérico). Con esto, en r/madrid linkas a `mypoop.app/city/madrid` y el redditor abre y ve **inmediatamente** un mapa centrado en su ciudad con stats y baños top. Brutal para conversión.

Bonus: cada página es una **landing SEO independiente** que Google indexa para queries tipo *"public bathrooms in [city]"*.

### Implementación

**Archivo:** `pages/city/[slug].vue`

**Lógica:**

1. Cargar config de la ciudad por slug (mismo array de `CITIES` que usamos en el seed, pero exportado a `utils/cities.ts` para reuso entre script y app)
2. Hacer SSR fetch de `bathrooms` filtrados por bounding box (usando `latitude/longitude BETWEEN`)
3. Centrar el mapa en el centro del bbox
4. Mostrar:
   - Mapa con los baños de esa ciudad
   - Stats: total, gratis, accesibles, top rated
   - Lista de top 5 mejor valorados
   - CTA: *"Did we miss one? Add it →"*
5. Meta tags SSR específicos:
   ```ts
   useSeoMeta({
     title: `Public bathrooms in ${city.name} — My Poop`,
     description: `${count} reviewed public toilets in ${city.name}. Find clean, accessible, free restrooms with real ratings.`,
     ogImage: `/og/city/${slug}.png`,
   })
   ```

**Cosas a tener en cuenta:**

- Hacer el fetch en `await useAsyncData()` para que el SSR mande HTML con los datos ya renderizados (crítico para SEO)
- El mapa sigue siendo `<ClientOnly>` pero la lista textual y stats salen en el HTML SSR
- Slugs en formato kebab-case: `madrid`, `kuala-lumpur`, `new-york`

---

## 4. PWA — `@vite-pwa/nuxt`

### Por qué (resumen del mensaje anterior)

Distribuir APK por Reddit = voto negativo garantizado + iPhone usuarios excluidos. PWA = "Add to Home Screen" en iOS y Android, instalación en 2 clicks sin warnings, **misma codebase Nuxt**, Capacitor sigue durmiendo para cuando publiques en Play Store.

### Pasos

1. **Instalar:**
   ```bash
   npm install -D @vite-pwa/nuxt
   ```

2. **Añadir al `nuxt.config.ts`:**
   ```ts
   modules: [
     '@nuxt/ui',
     '@nuxtjs/supabase',
     '@nuxtjs/i18n',
     '@vite-pwa/nuxt',
   ],
   pwa: {
     registerType: 'autoUpdate',
     manifest: {
       name: 'My Poop — Find Public Bathrooms',
       short_name: 'My Poop',
       description: 'Discover, rate and review public bathrooms near you.',
       theme_color: '#111827',
       background_color: '#111827',
       display: 'standalone',
       orientation: 'portrait',
       start_url: '/',
       icons: [
         { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
         { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
         { src: '/pwa/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
       ],
     },
     workbox: {
       navigateFallback: '/',
       globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
     },
   },
   ```

3. **Generar iconos** — usar [maskable.app](https://maskable.app) o [realfavicongenerator.net](https://realfavicongenerator.net) a partir del favicon SVG actual. Necesitas mínimo:
   - `public/pwa/icon-192.png` (192×192)
   - `public/pwa/icon-512.png` (512×512)
   - `public/pwa/icon-512-maskable.png` (512×512 con safe zone)

4. **Probar:**
   - `npm run build && npm run preview`
   - Abrir en Chrome móvil → debería aparecer banner de instalación
   - Abrir en Safari iOS → "Compartir" → "Add to Home Screen"
   - Verificar que se abre en pantalla completa sin barra de navegador

### Cuidado

- El service worker cachea muy agresivamente. Durante desarrollo **desactivarlo** (`pwa: { disable: true }` en dev) o usar `npm run preview` para tests reales
- iOS PWA **NO soporta push notifications** todavía bien — no contar con eso
- iOS PWA pierde el storage si el usuario no la abre en 7 días — no es para datos críticos, pero para una app de mapa está bien

---

## 5. Auditoría cold start sin geolocalización

**No es código, es testing.** Pero crítico.

### Qué probar

1. Abrir la app en modo incógnito en tu móvil
2. **Rechazar** la geolocalización cuando la pida
3. Mirar dónde se centra el mapa

### Qué puede ir mal

- Centra en `(0, 0)` → océano vacío → muerte instantánea del usuario
- Centra en un default raro (San Francisco, Greenwich) → confunde
- Pide permisos infinitamente sin fallback → frustración
- Mapa se queda en blanco → bug crítico

### Soluciones rápidas según lo que encuentres

- **Mejor:** detección de país por IP. Vercel da `request.geo.country` gratis en edge functions. Centrar en la capital del país detectado.
- **Decente:** fallback a Madrid (porque tu audiencia inicial es ES) con un toast: *"Showing Madrid — allow location to see your area"*
- **Mínimo:** centrar en una ciudad popular del seed (Madrid, KL, NYC) según `Accept-Language` header

---

## 6. Rate limiting RLS — anti-troll mínimo

### Por qué

Reddit garantiza traer trolls. Alguien intentará crear 50 baños falsos en Madrid en un loop, spammear reviews, subir basura. NSFW.js cubre fotos pero no esto.

### Implementación

**Solo SQL en Supabase, sin tocar código frontend.** Las RLS policies se evalúan en cada INSERT.

```sql
-- Máximo 5 baños creados por usuario por hora
create policy "bathrooms_rate_limit"
on bathrooms for insert
to authenticated
with check (
  (
    select count(*)
    from bathrooms
    where created_by = auth.uid()
      and created_at > now() - interval '1 hour'
  ) < 5
);

-- Máximo 10 reviews por usuario por hora
create policy "reviews_rate_limit"
on reviews for insert
to authenticated
with check (
  (
    select count(*)
    from reviews
    where user_id = auth.uid()
      and created_at > now() - interval '1 hour'
  ) < 10
);
```

⚠️ **Verificar primero** que no rompe las policies de INSERT existentes. Probablemente ya hay una policy `auth.uid() = created_by` — la nueva se añade ENCIMA y AMBAS deben pasar (Supabase RLS es AND entre policies del mismo comando). Si la auth check ya está en otra policy, no la dupliques.

### Después del seed: limpieza

Si hay incidente y un troll crea 50 baños antes de darte cuenta, recovery:

```sql
delete from bathrooms
where created_by = '<user-uuid-del-troll>'
  and source = 'user';
```

(El `source = 'user'` protege de borrar accidentalmente los OSM.)

---

## 7. Vercel Analytics

5 minutos. Toggle en el dashboard de Vercel + script en `app.vue` o nuxt.config:

```bash
npm install @vercel/analytics
```

```vue
<!-- app.vue -->
<script setup>
import { inject } from '@vercel/analytics'
if (process.client) inject()
</script>
```

Es cookieless, no necesita banner GDPR. Da: visitas, países, devices, top pages. Suficiente para entender cada post de Reddit.

---

## 8. Reportes anónimos (still here / closed / doesn't exist)

### Por qué

Los baños de OSM van a tener errores (lugares cerrados, datos viejos). Necesitas un mecanismo de validación de datos **sin la fricción del signup**, porque la mayoría de redditors no se va a registrar para reportar.

### Implementación

**Tabla nueva en Supabase:**

```sql
create table bathroom_reports (
  id uuid primary key default gen_random_uuid(),
  bathroom_id uuid not null references bathrooms(id) on delete cascade,
  report_type text not null check (report_type in ('still_here', 'closed', 'doesnt_exist')),
  fingerprint text not null,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index bathroom_reports_bathroom_idx on bathroom_reports(bathroom_id);
create unique index bathroom_reports_unique on bathroom_reports(bathroom_id, fingerprint, report_type);
```

**Rate limit por fingerprint** — usar `@fingerprintjs/fingerprintjs` (gratis open source) en el cliente para generar un ID semi-estable, no perfect-anti-abuse pero suficiente para evitar el clicker promedio.

**Server route para insertar:**

```ts
// server/api/bathroom/[id]/report.post.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const ip = getRequestIP(event, { xForwardedFor: true })

  // Insertar con service role (skip RLS)
  // Validar tipo, validar fingerprint presente
  // Hash IP + sal → ip_hash
  // Insertar
})
```

**Composable + UI:**

`composables/useBathroomReports.ts` con tres métodos: `reportStillHere(id)`, `reportClosed(id)`, `reportDoesntExist(id)`.

En `BathroomDetailModal.vue`, debajo del nombre:

```vue
<div class="flex gap-2 mt-2">
  <UButton size="xs" variant="ghost" icon="i-heroicons-check-circle" @click="reportStillHere">
    Still here
  </UButton>
  <UButton size="xs" variant="ghost" icon="i-heroicons-lock-closed" @click="reportClosed">
    Closed
  </UButton>
  <UButton size="xs" variant="ghost" icon="i-heroicons-x-circle" @click="reportDoesntExist">
    Doesn't exist
  </UButton>
</div>
```

**Trigger de auto-ocultación:**

```sql
-- Cuando un baño tiene 5+ reportes "doesnt_exist", marcar y ocultar
create or replace function auto_hide_dead_bathrooms()
returns trigger as $$
begin
  if (
    select count(*) from bathroom_reports
    where bathroom_id = new.bathroom_id
      and report_type = 'doesnt_exist'
  ) >= 5 then
    update bathrooms
    set source = 'unverified'  -- o un campo nuevo `hidden = true`
    where id = new.bathroom_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger bathroom_reports_auto_hide
after insert on bathroom_reports
for each row execute function auto_hide_dead_bathrooms();
```

Alternativa más simple si añadir 'unverified' al check rompe cosas: añadir columna `is_hidden boolean default false` y filtrar `where is_hidden = false` en `useBathrooms.ts`.

---

## 9. Página About + GitHub link

`pages/about.vue` con un párrafo personal:

> Hi, I'm Ernesto. Spanish dev living in Kuala Lumpur. I built My Poop because traveling I got tired of opening 3 apps to find a decent public bathroom. It's free, no ads, no tracking. Code on GitHub. Feedback welcome at [...].

Link en el footer y en el menú del navbar. Versión ES también.

**Por qué importa más de lo que parece:** en r/SideProject y r/digitalnomad, los redditors clican el "About" *antes* de probar la app para decidir si vale la pena. Una historia humana convierte 3-5x mejor que una landing pulida sin contexto.

---

## 10. Privacy Policy mínima

`pages/privacy.vue`. 200 palabras escritas a mano que digan la verdad:

- Qué data guardas (email opcional, reviews, fotos opcionales)
- Qué NO guardas (no tracking, no ads, no venta de datos)
- Dónde está hospedada (Supabase EU/US, Vercel)
- Cómo borrar tu cuenta (botón en profile o email)
- Contacto

Linka desde el footer. Imprescindible para Google OAuth, Play Store, y para que los redditors no te acribillen a *"what data?"*.

---

## 11. Email "tu baño tiene actividad" — el motor de retención

### Por qué

**Esto decide si el lanzamiento es un pico o una curva.** Sin retención, todo el tráfico de Reddit se evapora en 3 días. Con un email semanal que diga *"esta semana 3 personas reseñaron tu baño"*, los usuarios vuelven solos y se sienten dueños. Mecánica clásica de Wikipedia, Yelp, Local Guides.

### Implementación

**Stack gratis:**
- Supabase Edge Function (Deno) corriendo en cron semanal
- [Resend](https://resend.com) — 3000 emails/mes gratis, API simple, dominio verificado en 5 min

**Lo que hace la edge function:**

1. Para cada usuario con baños creados:
   - Buscar reviews creadas en sus baños en los últimos 7 días
   - Si hay >= 1, generar email con resumen
2. Enviar via Resend
3. Logear en una tabla `email_log` para no duplicar

**Plantilla del email** (HTML simple, no template engine):

```
Hi {{display_name}},

This week, your bathroom "{{bathroom.name}}" got:
- 3 new reviews (avg 4.2 🧻)
- 1 new photo

See what people said: {{link}}

—
You're getting this because you added bathrooms to My Poop.
Unsubscribe: {{unsubscribe_link}}
```

**Cron:** Supabase tiene `pg_cron` extension. Programar un `select cron.schedule('weekly-digest', '0 9 * * 1', $$ ... $$);` que invoca la edge function cada lunes 9am.

⚠️ Necesita el dominio verificado en Resend (DNS records). Y un link de unsubscribe funcional (otra tabla + endpoint público).

---

## 12. Sitemap + Search Console

```bash
npx nuxi module add sitemap
```

En `nuxt.config.ts`:
```ts
sitemap: {
  sources: ['/api/__sitemap__/urls'],
  defaults: { changefreq: 'weekly', priority: 0.7 },
}
```

Server route que devuelve URLs dinámicas (todas las `/bathroom/[id]` + todas las `/city/[slug]`):

```ts
// server/api/__sitemap__/urls.ts
export default defineSitemapEventHandler(async () => {
  const supabase = serverSupabaseClient(...)
  const { data } = await supabase.from('bathrooms').select('id, updated_at')
  return [
    ...CITIES.map(c => ({ loc: `/city/${slugify(c.name)}`, priority: 0.9 })),
    ...data.map(b => ({ loc: `/bathroom/${b.id}`, lastmod: b.updated_at })),
  ]
})
```

Después: subir `mypoop.app/sitemap.xml` a [Google Search Console](https://search.google.com/search-console). Verificar dominio. Esperar 1-3 semanas a que indexe.

---

## 13. OG image dinámica por baño

Para que cuando alguien comparta un link de baño desde la app (o desde Reddit), el preview en WhatsApp/Twitter/Discord muestre algo bonito y específico.

**Server route:** `server/routes/og/bathroom/[id].png.ts`

Usar `@vercel/og` (gratis) o `og-img`:

```ts
import { ImageResponse } from '@vercel/og'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const bathroom = await fetchBathroom(id)

  return new ImageResponse(
    h('div', { style: { ... } }, [
      h('h1', bathroom.name),
      h('div', `${bathroom.avg_rating} 🧻`),
      h('div', `${bathroom.review_count} reviews`),
    ]),
    { width: 1200, height: 630 }
  )
})
```

Y en `pages/bathroom/[id].vue` actualizar `useSeoMeta` para que `ogImage` apunte a `/og/bathroom/${id}.png`.

---

## 14. Screenshots + video del flujo SOS

**No es código pero define el éxito del post.** Posts con video/GIF tienen ~5x más upvotes en la primera hora.

### Lo que necesitas

- **3-5 screenshots** del mapa, del formulario de añadir baño, del modal de detalle, de una review con foto, del botón SOS. Limpios, en marco de móvil ([mockuphone.com](https://mockuphone.com) gratis).
- **1 GIF/video de 15-25 segundos** mostrando el flujo de urgencia completo:
  1. Pantalla de mapa con baños cerca
  2. Tap al botón rojo SOS
  3. Animación → centra en el más cercano
  4. Tap en el marker → modal con detalles
  5. Tap en "How to get there" → abre Google Maps con direcciones
- Música ninguna. Texto superpuesto opcional ("when you really need to go...").

### Cómo grabarlo

- QuickTime para grabar pantalla de iPhone conectado por cable, o `adb shell screenrecord` para Android
- Recortar con `ffmpeg`:
  ```bash
  ffmpeg -i input.mov -ss 5 -t 20 -vf "fps=15,scale=480:-1" output.gif
  ```
- Optimizar con `gifski` para que pese < 5MB (límite de Reddit)

---

## Orden de ataque sugerido

**Sprint 1 — bloqueantes para Reddit (1-2 días):**
1. Migración SQL (osm_id, source, rate limiting policies)
2. Script seed-osm.ts + ejecutarlo para Madrid + KL como prueba
3. Verificar mapa en local con datos OSM
4. Resto de ciudades
5. Edición de baños OSM (migración `user_edited` + RLS + UI)
6. Páginas de ciudad
7. PWA setup + iconos
8. Auditoría cold start sin geo + fix si necesario
9. Vercel Analytics

**Sprint 2 — antes del primer post (1 día):**
10. About page + GitHub link
11. Privacy policy
12. Screenshots + video
13. Deploy a Vercel
14. Test end-to-end en móvil real (Android + iPhone si tienes acceso)

**Sprint 3 — durante/después del lanzamiento (resto de la semana):**
15. Sitemap + Google Search Console
16. Reportes anónimos
17. Email semanal de retención
18. OG images dinámicas

Las del sprint 3 no bloquean el post pero deberían estar antes de los posts grandes (r/InternetIsBeautiful, r/travel) porque ahí ya juegas con audiencia masiva y necesitas todo afilado.
