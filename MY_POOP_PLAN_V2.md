# My Poop V2 — Plan de Mejoras

## Contexto

La app base está funcionando (mapa, auth, CRUD baños, reviews, moderación). Este plan cubre las mejoras post-MVP para llevar la app a producción con features que los usuarios esperan.

**Stack actual:** Nuxt 3 + Vue 3 | Nuxt UI v3 + Tailwind | Supabase | Leaflet + OSM | Photon geocoder | i18n | Capacitor (pendiente) | Vercel (pendiente)

---

## Fase 1: "Cómo llegar" (abrir Google Maps)

### ¿Qué hace?
Botón en el modal de detalle del baño que abre Google Maps (o Apple Maps en iOS) con la ruta a pie desde la ubicación del usuario hasta el baño.

### Implementación

1. Añadir botón "Get Directions" en `BathroomDetailModal.vue`, dentro de `BathroomInfo`
2. Al hacer click, construir la URL:
   ```
   https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=walking
   ```
3. En iOS (detectar con `navigator.userAgent`), usar alternativamente:
   ```
   https://maps.apple.com/?daddr={lat},{lng}&dirflg=w
   ```
4. Abrir con `window.open(url, '_blank')`
5. Añadir traducciones: `bathroom.getDirections` → "Get Directions" / "Cómo llegar"

### Archivos a modificar
- `components/bathroom/BathroomInfo.vue` — añadir botón
- `i18n/locales/en.json`, `es.json` — traducciones

**Complejidad:** Baja (~15 min)

---

## Fase 2: Compartir baño por WhatsApp

### ¿Qué hace?
Botón en el modal de detalle del baño que abre WhatsApp con un mensaje pre-escrito con el nombre del baño, rating y un link.

### Implementación

1. Crear página pública `/bathroom/[id].vue` que muestre info del baño (necesaria para que el link compartido tenga sentido)
2. Añadir meta tags dinámicos con `useHead()` en esa página para preview en WhatsApp (og:title, og:description)
3. Añadir botón "Share" en `BathroomDetailModal.vue`
4. Al hacer click, usar la Web Share API (nativa en móvil) con fallback a link de WhatsApp:
   ```js
   // Intentar Web Share API primero (funciona en mobile, cubre WhatsApp, Telegram, etc.)
   if (navigator.share) {
     await navigator.share({
       title: bathroom.name,
       text: `${bathroom.name} — ${bathroom.avg_rating}/5 🧻`,
       url: `${window.location.origin}/bathroom/${bathroom.id}`
     })
   } else {
     // Fallback: abrir WhatsApp directamente
     const text = `${bathroom.name} — ${bathroom.avg_rating}/5 🧻\n${window.location.origin}/bathroom/${bathroom.id}`
     window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
   }
   ```
5. Añadir traducciones: `bathroom.share` → "Share" / "Compartir"

### Archivos a crear
- `pages/bathroom/[id].vue` — página pública del baño

### Archivos a modificar
- `components/bathroom/BathroomDetailModal.vue` — botón share
- `composables/useBathrooms.ts` — función `fetchBathroomById`
- `i18n/locales/en.json`, `es.json` — traducciones

**Complejidad:** Media (~1-2h)

---

## Fase 3: Favoritos

### ¿Qué hace?
Los usuarios pueden guardar baños en una lista de favoritos. Un corazón/estrella en el marker o en el modal, y una tab "Favorites" en el perfil con la lista guardada.

### Paso 3.1: Tabla en Supabase

```sql
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bathroom_id UUID NOT NULL REFERENCES public.bathrooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, bathroom_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Usuarios ven solo sus favoritos
CREATE POLICY "favorites_select_own"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Usuarios autenticados pueden añadir favoritos
CREATE POLICY "favorites_insert_own"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden quitar sus favoritos
CREATE POLICY "favorites_delete_own"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);
```

### Paso 3.2: Types

Añadir a `types/index.ts`:
```ts
export interface Favorite {
  id: string
  user_id: string
  bathroom_id: string
  created_at: string
}
```

### Paso 3.3: Composable `useFavorites.ts`

```ts
// Funciones:
// - fetchFavorites() → Favorite[] con datos del baño (join bathrooms)
// - toggleFavorite(bathroomId) → añade o quita de favoritos
// - isFavorite(bathroomId) → computed boolean
```

### Paso 3.4: UI

1. **BathroomDetailModal** — botón corazón ♡/♥ en el header, al lado del nombre
2. **Profile → tab "Favorites"** — lista de baños favoritos con link para centrar en mapa
3. **Markers en mapa** — los baños marcados como favoritos usan un marker SVG diferente (fondo rojo/rosado) para distinguirlos visualmente de los normales. Requiere que `updateMarkers` en `MapView.vue` reciba la lista de favoritos y elija el icono según si el baño está en favoritos o no.

### Archivos a crear
- `composables/useFavorites.ts`

### Archivos a modificar
- `types/index.ts` — tipo Favorite
- `components/bathroom/BathroomDetailModal.vue` — botón favorito
- `pages/profile.vue` — nueva tab Favorites
- `components/profile/FavoritesList.vue` — nuevo componente
- `i18n/locales/en.json`, `es.json` — traducciones

**Complejidad:** Media (~2-3h)

---

## Fase 4: Página pública de baño (SEO + compartir)

### ¿Qué hace?
URL pública `/bathroom/:id` que muestra la info del baño con SSR. Necesaria para que los links compartidos por WhatsApp muestren un preview con título y descripción. También mejora el SEO.

### Implementación

1. Crear `pages/bathroom/[id].vue`
2. Usar `useAsyncData` para fetch SSR del baño por ID
3. Usar `useHead()` / `useSeoMeta()` para meta tags dinámicos
4. Mostrar: nombre, tipo, rating, reviews, mapa pequeño con marker
5. Botón "Open in App" que navega a `/` y abre el modal del baño
6. JSON-LD structured data (LocalBusiness schema) para SEO

### Archivos a crear
- `pages/bathroom/[id].vue`

### Archivos a modificar
- `composables/useBathrooms.ts` — `fetchBathroomById(id)`

**Complejidad:** Media (~2h)

---

## Fase 5: Scale control + Fit bounds

### ¿Qué hace?
- Barra de escala en el mapa (metros/km)
- Botón para hacer zoom automático y ver todos los baños en pantalla

### Implementación

1. Añadir `L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)` en `initMap`
2. Crear botón "Show All" que calcule los bounds de todos los markers y haga `map.fitBounds()`
3. Colocar el botón al lado del botón "My Location"

### Archivos a modificar
- `components/map/MapView.vue`

**Complejidad:** Baja (~30 min)

---

## Fase 6: Capacitor (Android + iOS)

### ¿Qué hace?
Wrappear la web app en una app nativa para publicar en Google Play Store y App Store.

### Implementación

1. Instalar Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "My Poop" "com.mypoop.app" --web-dir .output/public
   ```
2. Añadir plataformas:
   ```bash
   npm install @capacitor/android @capacitor/ios
   npx cap add android
   npx cap add ios
   ```
3. Plugins nativos útiles:
   - `@capacitor/geolocation` — permisos nativos de GPS (mejor que browser API)
   - `@capacitor/share` — compartir nativo (reemplaza Web Share API)
   - `@capacitor/splash-screen` — pantalla de carga
   - `@capacitor/status-bar` — estilizar barra de estado
4. Configurar `capacitor.config.ts`:
   ```ts
   const config: CapacitorConfig = {
     appId: 'com.mypoop.app',
     appName: 'My Poop',
     webDir: '.output/public',
     server: {
       // En desarrollo, apuntar al dev server
       url: 'http://TU_IP_LOCAL:3000',
       cleartext: true
     }
   }
   ```
5. Build y sync:
   ```bash
   npm run generate  # o npm run build
   npx cap sync
   npx cap open android  # abre Android Studio
   npx cap open ios      # abre Xcode
   ```
6. Iconos y splash screens con `@capacitor/assets`
7. Configurar deep links para que `/bathroom/:id` abra la app

### Archivos a crear
- `capacitor.config.ts`
- `android/` y `ios/` (generados por Capacitor)

### Archivos a modificar
- `nuxt.config.ts` — ajustes para generate/SSG si se usa `npm run generate`
- `composables/useGeolocation.ts` — usar plugin nativo de Capacitor si disponible

**Complejidad:** Alta (~4-6h entre setup, testing, iconos, permisos)

---

## Fase 7: Deploy en Vercel

### ¿Qué hace?
Publicar la web app en producción con dominio real.

### Implementación

1. Crear cuenta en Vercel (gratis)
2. Conectar el repo de GitHub/GitLab
3. Configurar variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (anon key)
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Vercel detecta Nuxt automáticamente, no necesita config extra
5. Configurar dominio personalizado (opcional)
6. Actualizar en Supabase:
   - Authentication → URL Configuration → Site URL → URL de Vercel
   - Redirect URLs → añadir URL de Vercel + `/confirm`
   - Google OAuth → añadir redirect URI de Vercel

### Archivos a modificar
- `.env.example` — documentar variables necesarias

**Complejidad:** Baja (~30 min)

---

## Orden de implementación recomendado

1. **Fase 1** → "Cómo llegar" (15 min, valor inmediato)
2. **Fase 5** → Scale + Fit bounds (30 min, mejora de mapa)
3. **Fase 3** → Favoritos (2-3h, feature clave)
4. **Fase 4** → Página pública de baño (2h, necesaria para Fase 2)
5. **Fase 2** → Compartir por WhatsApp (1h, depende de Fase 4)
6. **Fase 7** → Deploy Vercel (30 min, poner en producción)
7. **Fase 6** → Capacitor (4-6h, al final cuando todo esté probado en web)

**Tiempo total estimado:** ~12-15h de desarrollo
