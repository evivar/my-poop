# My Poop V3 — Plan de Mejoras

## Contexto

Con las fases V1 (app base) y V2 (favoritos, compartir, cómo llegar, página pública) completadas, este plan añade features avanzadas que mejoran la utilidad y el engagement de la app.

**Stack actual:** Nuxt 3 + Vue 3 | Nuxt UI v3 + Tailwind | Supabase (DB + Auth + Storage) | Leaflet + OSM | Photon geocoder | i18n

---

## Fase 1: Filtros en el mapa

### ¿Qué hace?
Permite al usuario filtrar los baños visibles en el mapa por tipo, gratis/de pago, accesible y rating mínimo. Los markers se ocultan/muestran dinámicamente sin recargar datos.

### Paso 1.1: Componente de filtros

Crear `components/map/MapFilters.vue` — un panel/dropdown flotante sobre el mapa con:
- **Tipo**: multiselect con todos los tipos (public, restaurant, gas_station, mall, cafe, hotel, hospital, other)
- **Gratis**: toggle (todos / solo gratis)
- **Accesible**: toggle (todos / solo accesibles)
- **Rating mínimo**: slider o selector 1-5 rollitos

### Paso 1.2: Lógica de filtrado

En `MapView.vue`:
1. Crear estado reactivo `filters`:
   ```ts
   const filters = reactive({
     types: [] as string[],       // vacío = todos
     onlyFree: false,
     onlyAccessible: false,
     minRating: 0,
   })
   ```
2. Crear computed `filteredBathrooms` que filtra `bathrooms` según `filters`
3. Cambiar el watcher de markers para usar `filteredBathrooms` en vez de `bathrooms`
4. El `MapFilters` componente emite cambios via `v-model` o props/emits

### Paso 1.3: UI

- Botón de filtro (icono funnel) flotante en el mapa, al lado del SearchBox o debajo
- Al clickar, se expande un panel con los filtros
- Badge con número de filtros activos sobre el botón
- Botón "Clear filters" para resetear

### Archivos a crear
- `components/map/MapFilters.vue`

### Archivos a modificar
- `components/map/MapView.vue` — filteredBathrooms, pasar filters
- `i18n/locales/en.json`, `es.json` — traducciones de filtros

**Complejidad:** Media (~1-2h)

---

## Fase 2: Fotos en baños y reviews

### ¿Qué hace?
Los usuarios pueden subir fotos en tres contextos:
- **Al crear un baño** — fotos del lugar para que otros lo identifiquen
- **Al dejar una review** — fotos del estado actual del baño
- **En cualquier momento** — cualquier usuario logueado puede añadir fotos a un baño existente sin necesidad de dejar review (botón "Add photo" en el modal)

La galería del baño combina automáticamente las fotos subidas directamente al baño + las fotos de todas sus reviews, mostrando una colección unificada.

Las fotos se validan con NSFW.js en el cliente antes de subirse a Supabase Storage.

### Paso 2.1: Supabase Storage

1. Crear bucket `photos` en Supabase Dashboard → Storage (un solo bucket para todo)
2. Configurar políticas de acceso:

```sql
-- Política para que cualquiera pueda ver las fotos (públicas)
CREATE POLICY "photos_select_all"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

-- Política para que usuarios autenticados suban fotos
CREATE POLICY "photos_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'photos'
    AND auth.uid() IS NOT NULL
  );

-- Política para que usuarios borren sus propias fotos (subcarpeta = userId)
CREATE POLICY "photos_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Paso 2.2: Tabla de fotos (unificada para baños y reviews)

```sql
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bathroom_id UUID REFERENCES public.bathrooms(id) ON DELETE CASCADE,
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Al menos uno de bathroom_id o review_id debe estar presente
  CONSTRAINT photos_must_have_parent CHECK (bathroom_id IS NOT NULL OR review_id IS NOT NULL)
);

CREATE INDEX idx_photos_bathroom ON public.photos (bathroom_id) WHERE bathroom_id IS NOT NULL;
CREATE INDEX idx_photos_review ON public.photos (review_id) WHERE review_id IS NOT NULL;

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver fotos de baños
CREATE POLICY "photos_select_bathroom"
  ON public.photos FOR SELECT
  USING (bathroom_id IS NOT NULL);

-- Cualquiera puede ver fotos de reviews no ocultas
CREATE POLICY "photos_select_review"
  ON public.photos FOR SELECT
  USING (
    review_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.id = review_id AND r.is_hidden = FALSE
    )
  );

-- Usuarios autenticados pueden insertar fotos
CREATE POLICY "photos_insert_authenticated"
  ON public.photos FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- El autor puede borrar sus fotos, admins también
CREATE POLICY "photos_delete_own_or_admin"
  ON public.photos FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Paso 2.3: Instalar NSFW.js

```bash
npm install nsfwjs @tensorflow/tfjs
```

### Paso 2.4: Composable `usePhotoUpload.ts`

```ts
// Funciones:
// - validateImage(file: File) → Promise<boolean>  (usa NSFW.js)
// - uploadPhoto(file: File, target: { bathroomId?: string, reviewId?: string }) → Promise<string>
// - getPhotoUrl(storagePath: string) → string  (URL pública)
// - deletePhoto(photoId: string, storagePath: string) → Promise<void>
// - fetchPhotosForBathroom(bathroomId: string) → Promise<Photo[]>
// - fetchPhotosForReview(reviewId: string) → Promise<Photo[]>
```

Flujo de `validateImage`:
1. Cargar el modelo NSFW.js (lazy, se cachea)
2. Crear un `<img>` temporal con la foto
3. Clasificar con `model.classify(img)`
4. Si `porn > 0.3` o `hentai > 0.3` → rechazar
5. Retornar true/false

Flujo de `uploadPhoto`:
1. Llamar `validateImage` primero
2. Si pasa, subir a Supabase Storage:
   - Fotos de baños: `{userId}/bathrooms/{bathroomId}/{timestamp}.jpg`
   - Fotos de reviews: `{userId}/reviews/{reviewId}/{timestamp}.jpg`
3. Insertar registro en `photos` con `bathroom_id` o `review_id`
4. Retornar la URL pública

### Paso 2.5: Componente reutilizable `PhotoUploader.vue`

Crear `components/ui/PhotoUploader.vue` — componente reutilizable para los 3 contextos:
1. Input de tipo file con `accept="image/jpeg,image/png,image/webp"` y `capture="environment"` (cámara en móvil)
2. Prop `maxPhotos` (3 para baños, 2 para reviews)
3. Max 5MB por foto
4. Preview de las fotos seleccionadas con botón X para quitar
5. Validación NSFW.js antes de añadir al preview
6. Emite `update:files` con la lista de File[]
7. Mostrar error inline si la foto es rechazada: "This image doesn't meet our guidelines"

### Paso 2.6: Modificar BathroomForm (fotos al crear baño)

1. Añadir `<UiPhotoUploader v-model:files="photos" :max-photos="3" />`
2. Al hacer submit: crear baño → subir fotos con `bathroom_id`

### Paso 2.7: Modificar ReviewForm (fotos en reviews)

1. Añadir `<UiPhotoUploader v-model:files="photos" :max-photos="2" />`
2. Al hacer submit: crear review → subir fotos con `review_id`

### Paso 2.8: Botón "Add photo" en BathroomDetailModal

1. Debajo de la galería, botón "Add photo" (solo si usuario logueado)
2. Abre un input de file inline o un mini-modal
3. Valida con NSFW.js → sube a Storage con `bathroom_id`
4. La galería se refresca automáticamente

### Paso 2.9: Mostrar fotos

**Galería del baño (BathroomDetailModal + página pública):**
1. Función `fetchAllBathroomPhotos(bathroomId)` que hace:
   ```sql
   SELECT * FROM photos WHERE bathroom_id = $1
   UNION ALL
   SELECT p.* FROM photos p
   JOIN reviews r ON r.id = p.review_id
   WHERE r.bathroom_id = $1 AND r.is_hidden = FALSE
   ORDER BY created_at DESC
   ```
2. Galería horizontal de thumbnails encima de BathroomInfo
3. Si no hay fotos, mostrar placeholder gris con icono de cámara
4. Click en thumbnail abre la foto en tamaño completo (nuevo tab)

**En ReviewCard:**
1. Incluir `photos` en el query de reviews (join)
2. Mostrar thumbnails debajo del comentario
3. Click en thumbnail abre la foto en tamaño completo

### Paso 2.8: Tipos

Añadir a `types/index.ts`:
```ts
export interface Photo {
  id: string
  bathroom_id: string | null
  review_id: string | null
  uploaded_by: string
  storage_path: string
  created_at: string
}
```

Actualizar `Review` y `Bathroom` para incluir fotos:
```ts
export interface Review {
  // ... campos existentes
  photos?: Photo[]
}

export interface Bathroom {
  // ... campos existentes
  photos?: Photo[]
}
```

### Archivos a crear
- `composables/usePhotoUpload.ts` — validación NSFW, upload, fetch, delete
- `components/ui/PhotoUploader.vue` — componente reutilizable (input + preview + validación)

### Archivos a modificar
- `types/index.ts` — Photo, actualizar Review y Bathroom
- `components/bathroom/BathroomForm.vue` — integrar PhotoUploader (max 3)
- `components/review/ReviewForm.vue` — integrar PhotoUploader (max 2)
- `components/review/ReviewCard.vue` — mostrar thumbnails de review
- `components/bathroom/BathroomDetailModal.vue` — galería unificada + botón "Add photo"
- `pages/bathroom/[id].vue` — galería de fotos en página pública
- `composables/useReviews.ts` — incluir photos en los queries
- `i18n/locales/en.json`, `es.json` — traducciones

**Complejidad:** Alta (~5-6h)

---

## Fase 3: Upvotes en reviews

### ¿Qué hace?
Los usuarios pueden votar "útil" en reviews de otros. Las reviews con más votos aparecen primero. Cada usuario solo puede votar una vez por review.

### Paso 3.1: Tabla en Supabase

```sql
CREATE TABLE public.review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(review_id, user_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los votos (necesario para contar)
CREATE POLICY "review_votes_select_all"
  ON public.review_votes FOR SELECT
  USING (true);

-- Usuarios autenticados pueden votar
CREATE POLICY "review_votes_insert_authenticated"
  ON public.review_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
  );

-- Usuarios pueden quitar su voto
CREATE POLICY "review_votes_delete_own"
  ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);
```

### Paso 3.2: Añadir contador a reviews

```sql
-- Añadir columna de cache para no hacer COUNT en cada query
ALTER TABLE public.reviews ADD COLUMN vote_count INTEGER DEFAULT 0;

-- Trigger para mantener el contador actualizado
CREATE OR REPLACE FUNCTION update_review_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews SET vote_count = vote_count + 1 WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews SET vote_count = vote_count - 1 WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER review_vote_count_trigger
AFTER INSERT OR DELETE ON public.review_votes
FOR EACH ROW EXECUTE FUNCTION update_review_vote_count();
```

### Paso 3.3: Tipos

Añadir a `types/index.ts`:
```ts
export interface ReviewVote {
  id: string
  review_id: string
  user_id: string
  created_at: string
}
```

Actualizar `Review`:
```ts
export interface Review {
  // ... campos existentes
  vote_count: number
  user_has_voted?: boolean  // se calcula en el frontend
}
```

### Paso 3.4: Composable `useReviewVotes.ts`

```ts
// Funciones:
// - toggleVote(reviewId: string) → Promise<void>
// - fetchUserVotes(reviewIds: string[]) → Promise<Set<string>>  (IDs de reviews que el usuario ya votó)
```

### Paso 3.5: UI en ReviewCard

1. Añadir botón de upvote (icono thumb-up o arrow-up) con contador
2. Si el usuario ya votó, el botón se muestra activo (color primario)
3. Click hace toggle (votar/quitar voto)
4. Ordenar reviews por `vote_count DESC, created_at DESC`

### Archivos a crear
- `composables/useReviewVotes.ts`

### Archivos a modificar
- `types/index.ts` — ReviewVote, actualizar Review
- `components/review/ReviewCard.vue` — botón upvote + contador
- `composables/useReviews.ts` — ordenar por vote_count, incluir vote_count
- `i18n/locales/en.json`, `es.json` — traducciones

**Complejidad:** Media (~1-2h)

---

## Fase 4: Estado en tiempo real de los baños

### ¿Qué hace?
Los usuarios pueden reportar el estado actual de un baño (sin papel, sucio, cerrado, etc.). Los reportes se agregan y se auto-expiran después de 4 horas. Si 2+ usuarios reportan lo mismo, se muestra como badge.

### Paso 4.1: Tabla en Supabase

```sql
CREATE TABLE public.bathroom_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bathroom_id UUID NOT NULL REFERENCES public.bathrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('no_paper', 'dirty', 'closed', 'out_of_order', 'flooded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bathroom_status_recent
  ON public.bathroom_status (bathroom_id, created_at DESC);

ALTER TABLE public.bathroom_status ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver los estados
CREATE POLICY "bathroom_status_select_all"
  ON public.bathroom_status FOR SELECT
  USING (true);

-- Usuarios autenticados pueden reportar estados
CREATE POLICY "bathroom_status_insert_authenticated"
  ON public.bathroom_status FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() IS NOT NULL
  );
```

### Paso 4.2: Función SQL para obtener estados activos

```sql
-- Función que devuelve estados con 2+ reportes en las últimas 4 horas
CREATE OR REPLACE FUNCTION get_active_bathroom_statuses(p_bathroom_id UUID)
RETURNS TABLE (status TEXT, report_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT bs.status, COUNT(*) as report_count
  FROM public.bathroom_status bs
  WHERE bs.bathroom_id = p_bathroom_id
    AND bs.created_at > now() - interval '4 hours'
  GROUP BY bs.status
  HAVING COUNT(*) >= 2
  ORDER BY report_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Paso 4.3: Limpieza automática (opcional)

```sql
-- Función para limpiar reportes viejos (ejecutar periódicamente via cron de Supabase)
CREATE OR REPLACE FUNCTION cleanup_old_bathroom_statuses()
RETURNS void AS $$
BEGIN
  DELETE FROM public.bathroom_status
  WHERE created_at < now() - interval '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar con pg_cron (activar extension en Supabase Dashboard → Database → Extensions)
-- SELECT cron.schedule('cleanup-bathroom-status', '0 */6 * * *', 'SELECT cleanup_old_bathroom_statuses()');
```

### Paso 4.4: Tipos

Añadir a `types/index.ts`:
```ts
export type BathroomStatusType = 'no_paper' | 'dirty' | 'closed' | 'out_of_order' | 'flooded'

export interface BathroomStatus {
  id: string
  bathroom_id: string
  user_id: string
  status: BathroomStatusType
  created_at: string
}

export interface ActiveStatus {
  status: BathroomStatusType
  report_count: number
}
```

### Paso 4.5: Composable `useBathroomStatus.ts`

```ts
// Funciones:
// - reportStatus(bathroomId: string, status: BathroomStatusType) → Promise<void>
// - fetchActiveStatuses(bathroomId: string) → Promise<ActiveStatus[]>
// - getStatusLabel(status: BathroomStatusType) → string  (i18n)
// - getStatusIcon(status: BathroomStatusType) → string  (emoji o icono)
```

Mapeo de estados:
| status | label | emoji |
|---|---|---|
| no_paper | No toilet paper | 🧻❌ |
| dirty | Dirty | 🚫 |
| closed | Closed | 🔒 |
| out_of_order | Out of order | ⚠️ |
| flooded | Flooded | 🌊 |

### Paso 4.6: UI — Botones de reporte rápido

En `BathroomDetailModal.vue`, debajo del `BathroomInfo`:
1. Sección "Report current status" con botones emoji para cada estado
2. Solo visible para usuarios logueados
3. Cada botón envía un reporte con un click
4. Toast de confirmación: "Status reported, thanks!"
5. Un usuario solo puede reportar el mismo estado una vez cada 4 horas (validar en frontend o con constraint SQL)

### Paso 4.7: UI — Mostrar estados activos

En `BathroomDetailModal.vue` y en el tooltip del marker:
1. Si hay estados activos (2+ reportes), mostrar badges de alerta
2. Ejemplo: `🧻❌ Sin papel (3 reportes)` con badge rojo
3. En el tooltip del marker: añadir icono de alerta si hay estados activos

### Paso 4.8: Prevenir spam

```sql
-- Constraint: un usuario no puede reportar el mismo estado más de una vez cada 4 horas
-- Se valida en el frontend antes de insertar:
-- SELECT COUNT(*) FROM bathroom_status
-- WHERE bathroom_id = $1 AND user_id = $2 AND status = $3
-- AND created_at > now() - interval '4 hours'
```

### Archivos a crear
- `composables/useBathroomStatus.ts`

### Archivos a modificar
- `types/index.ts` — BathroomStatusType, BathroomStatus, ActiveStatus
- `components/bathroom/BathroomDetailModal.vue` — botones de reporte + badges
- `components/map/MapView.vue` — (opcional) indicador en tooltip
- `i18n/locales/en.json`, `es.json` — traducciones de estados

**Complejidad:** Media (~2-3h)

---

## Orden de implementación recomendado

1. **Fase 1** → Filtros en el mapa (1-2h, mejora inmediata de UX)
2. **Fase 3** → Upvotes en reviews (1-2h, engagement + ordenación útil)
3. **Fase 4** → Estado en tiempo real (2-3h, feature diferenciadora)
4. **Fase 2** → Fotos en reviews (3-4h, la más compleja pero impactante)

**Tiempo total estimado:** ~8-11h de desarrollo

---

## Después de V3

- Deploy en Vercel (pendiente de V2)
- Capacitor para Android/iOS (pendiente de V2)
- Gamificación (badges, leaderboard)
- Baño más cercano (botón de urgencia)
- Monetización (AdMob + baños destacados)
