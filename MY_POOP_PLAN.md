# My Poop - Plan de Implementación

## Contexto

Crear desde cero una aplicación web de reseñas de baños públicos, combinando descubrimiento en mapa (estilo Google Maps) con reseñas de usuarios (estilo Yelp). La app usa puntuaciones con rollitos de papel higiénico en vez de estrellas. El objetivo es lanzarla a producción con usuarios reales.

**Stack:** Nuxt 3 + Vue 3 | Nuxt UI + Tailwind (dark) | Supabase | Leaflet + OSM | Nominatim | Capacitor | i18n | Vercel

---

## Fase 1: Scaffolding y Configuración

1. Inicializar proyecto Nuxt 3: `npx nuxi@latest init my-poop`
2. Instalar dependencias:
   - `@nuxt/ui` (componentes + Tailwind)
   - `@nuxtjs/supabase` (auth + DB)
   - `nuxt-leaflet` (mapas)
   - `@nuxtjs/i18n` (internacionalización)
   - `@capacitor/core`, `@capacitor/cli` (mobile)
3. Configurar `nuxt.config.ts` con módulos, dark mode, Supabase redirect, i18n strategy `no_prefix`
4. Crear `.env` y `.env.example` con credenciales Supabase
5. Crear estructura de directorios completa

**Estructura del proyecto:**
```
my-poop/
├── components/
│   ├── app/          → Navbar.vue, Logo.vue
│   ├── auth/         → LoginModal.vue, RegisterModal.vue
│   ├── map/          → MapView.vue, SearchBox.vue, BathroomMarker.vue, UserLocationMarker.vue
│   ├── bathroom/     → BathroomDetailModal.vue, BathroomInfo.vue, BathroomForm.vue, RatingDisplay.vue
│   ├── review/       → ReviewList.vue, ReviewCard.vue, ReviewForm.vue, ReportButton.vue, ToiletPaperRating.vue
│   ├── profile/      → ProfileInfo.vue, PasswordChange.vue, ReviewHistory.vue, ModerationPanel.vue
│   └── ui/           → ToiletPaperRoll.vue
├── composables/      → useAuth, useBathrooms, useReviews, useGeolocation, useNominatim, useModeration, useProfile
├── i18n/locales/     → en.json, es.json
├── layouts/          → default.vue (navbar + slot sin scroll)
├── middleware/        → auth.ts, admin.ts
├── pages/            → index.vue (mapa), profile.vue, confirm.vue
├── plugins/          → leaflet-client.ts
├── public/markers/   → bathroom-marker.svg, user-location.svg
├── server/
│   ├── api/admin/    → reports.get.ts, approve.post.ts, delete.post.ts, ban.post.ts
│   └── utils/        → supabase.ts
└── types/            → index.ts
```

---

## Fase 2: Base de Datos Supabase (Guía paso a paso)

### Paso 2.1: Crear proyecto en Supabase
1. Ve a **app.supabase.com** → "New Project"
2. Elige organización, nombre del proyecto ("my-poop"), contraseña de DB y región
3. Espera ~2 min a que se cree. Anota la **URL** y la **anon key** (Settings → API)
4. También copia la **service_role key** (la necesitas para operaciones admin en el servidor)

### Paso 2.2: Configurar Autenticación
1. En el dashboard ve a **Authentication → Providers**
2. **Email**: ya viene habilitado por defecto. Activa "Confirm email" para que los usuarios verifiquen su email
3. **Google**:
   - Ve a **Google Cloud Console → APIs & Services → Credentials**
   - Crea un **OAuth 2.0 Client ID** (tipo Web Application)
   - En "Authorized redirect URIs" añade: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
   - Copia el **Client ID** y **Client Secret** y pégalos en el provider de Google en Supabase
4. En **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (desarrollo)
   - **Redirect URLs**: añade `http://localhost:3000/confirm` y (más adelante) tu URL de Vercel

### Paso 2.3: Habilitar PostGIS
1. En el dashboard ve a **Database → Extensions**
2. Busca "postgis" y haz click en "Enable"
3. O alternativamente, ve a **SQL Editor** y ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;
```

### Paso 2.4: Crear las tablas (SQL Editor)

Ve a **SQL Editor** en el dashboard. Puedes ejecutar todo en un solo script o tabla por tabla. Recomiendo tabla por tabla para ver errores más fácilmente.

**Script 1: Función auxiliar `update_updated_at`** (usada por varias tablas)
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Script 2: Tabla `profiles` + trigger auto-creación**
```sql
-- Tabla de perfiles (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: actualizar updated_at automáticamente
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Función: crear perfil automáticamente cuando un usuario se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ejecutar handle_new_user cuando se crea un usuario en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```
> **Qué hace:** Cuando alguien se registra (email o Google), Supabase crea un registro en `auth.users`. El trigger `on_auth_user_created` detecta esa inserción y automáticamente crea un perfil en `public.profiles` con el nombre del usuario (lo saca de los metadatos de Google o del email).

**Script 3: Tabla `bathrooms`**
```sql
CREATE TABLE public.bathrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,  -- columna geográfica para PostGIS
  latitude DOUBLE PRECISION NOT NULL,          -- lat/lng explícitos para lectura fácil
  longitude DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL DEFAULT 'public'
    CHECK (type IN ('public','restaurant','gas_station','mall','cafe','hotel','hospital','other')),
  is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
  is_free BOOLEAN NOT NULL DEFAULT TRUE,
  directions TEXT,    -- ej: "Dentro del centro comercial, 2ª planta junto al food court"
  schedule TEXT,      -- ej: "Lun-Vie 8:00-22:00, Sáb-Dom 9:00-20:00"
  avg_rating NUMERIC(3,2) DEFAULT 0,
  avg_cleanliness NUMERIC(3,2) DEFAULT 0,
  avg_privacy NUMERIC(3,2) DEFAULT 0,
  avg_toilet_paper_quality NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX bathrooms_location_idx ON public.bathrooms USING GIST (location);
CREATE INDEX bathrooms_type_idx ON public.bathrooms (type);
CREATE INDEX bathrooms_avg_rating_idx ON public.bathrooms (avg_rating DESC);

CREATE TRIGGER bathrooms_updated_at
  BEFORE UPDATE ON public.bathrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```
> **Nota sobre `location` vs `latitude`/`longitude`:** La columna `location` es tipo GEOGRAPHY de PostGIS, necesaria para queries geoespaciales eficientes (futuro clustering server-side). Las columnas `latitude` y `longitude` son para leer fácilmente las coordenadas sin parsear PostGIS. Al crear un baño, se insertan las tres.

**Script 4: Tabla `reviews`**
```sql
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bathroom_id UUID NOT NULL REFERENCES public.bathrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),           -- puntuación general (rollitos)
  cleanliness INTEGER NOT NULL CHECK (cleanliness BETWEEN 1 AND 5), -- limpieza
  privacy INTEGER NOT NULL CHECK (privacy BETWEEN 1 AND 5),         -- privacidad
  toilet_paper_quality INTEGER NOT NULL CHECK (toilet_paper_quality BETWEEN 1 AND 5), -- calidad del papel
  comment TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,  -- se oculta al ser reportada
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bathroom_id, user_id)  -- un usuario solo puede dejar una reseña por baño
);

CREATE INDEX reviews_bathroom_id_idx ON public.reviews (bathroom_id);
CREATE INDEX reviews_user_id_idx ON public.reviews (user_id);
CREATE INDEX reviews_hidden_idx ON public.reviews (is_hidden) WHERE is_hidden = TRUE;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**Script 5: Tabla `reports`**
```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  moderated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(review_id, reported_by)  -- un usuario solo puede reportar una reseña una vez
);

CREATE INDEX reports_status_idx ON public.reports (status) WHERE status = 'pending';
CREATE INDEX reports_review_id_idx ON public.reports (review_id);
```

### Paso 2.5: Crear Triggers de lógica de negocio

**Script 6: Recalcular medias del baño cuando cambian las reseñas**
```sql
CREATE OR REPLACE FUNCTION public.recalculate_bathroom_ratings()
RETURNS TRIGGER AS $$
DECLARE
  target_bathroom_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_bathroom_id := OLD.bathroom_id;
  ELSE
    target_bathroom_id := NEW.bathroom_id;
  END IF;

  UPDATE public.bathrooms
  SET
    avg_rating = COALESCE((
      SELECT AVG(rating)::NUMERIC(3,2) FROM public.reviews
      WHERE bathroom_id = target_bathroom_id AND is_hidden = FALSE
    ), 0),
    avg_cleanliness = COALESCE((
      SELECT AVG(cleanliness)::NUMERIC(3,2) FROM public.reviews
      WHERE bathroom_id = target_bathroom_id AND is_hidden = FALSE
    ), 0),
    avg_privacy = COALESCE((
      SELECT AVG(privacy)::NUMERIC(3,2) FROM public.reviews
      WHERE bathroom_id = target_bathroom_id AND is_hidden = FALSE
    ), 0),
    avg_toilet_paper_quality = COALESCE((
      SELECT AVG(toilet_paper_quality)::NUMERIC(3,2) FROM public.reviews
      WHERE bathroom_id = target_bathroom_id AND is_hidden = FALSE
    ), 0),
    review_count = (
      SELECT COUNT(*) FROM public.reviews
      WHERE bathroom_id = target_bathroom_id AND is_hidden = FALSE
    ),
    updated_at = NOW()
  WHERE id = target_bathroom_id;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_bathroom_ratings();
```
> **Qué hace:** Cada vez que se crea, edita o borra una reseña, este trigger recalcula automáticamente las medias (rating, limpieza, privacidad, papel) y el contador de reseñas del baño. Solo cuenta reseñas que NO están ocultas (is_hidden = FALSE).

**Script 7: Ocultar reseña automáticamente al ser reportada**
```sql
CREATE OR REPLACE FUNCTION public.auto_hide_reported_review()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.reviews SET is_hidden = TRUE WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_report_created
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_hide_reported_review();
```
> **Qué hace:** Cuando un usuario reporta una reseña, automáticamente se marca como oculta. Así desaparece de la vista pública hasta que un admin la modere.

### Paso 2.6: Políticas RLS (Row Level Security)

RLS es el sistema de permisos de Supabase a nivel de filas. Sin estas políticas, nadie puede leer ni escribir en las tablas.

**Script 8: RLS para `profiles`**
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver perfiles (necesario para mostrar nombres en reseñas)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Los usuarios solo pueden editar su propio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
> **Nota:** Los usuarios no pueden cambiar su `role` ni `is_banned` desde el frontend porque esos campos se controlan desde las server API routes con la service_role key, que bypasea RLS.

**Script 9: RLS para `bathrooms`**
```sql
ALTER TABLE public.bathrooms ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver baños (incluso sin login)
CREATE POLICY "bathrooms_select_all"
  ON public.bathrooms FOR SELECT
  USING (true);

-- Usuarios autenticados y no baneados pueden crear baños
CREATE POLICY "bathrooms_insert_authenticated"
  ON public.bathrooms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

-- Solo admins pueden editar baños
CREATE POLICY "bathrooms_update_admin"
  ON public.bathrooms FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Solo admins pueden borrar baños
CREATE POLICY "bathrooms_delete_admin"
  ON public.bathrooms FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Script 10: RLS para `reviews`**
```sql
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Todos ven reseñas no ocultas; el autor ve las suyas aunque estén ocultas; admins ven todo
CREATE POLICY "reviews_select_visible"
  ON public.reviews FOR SELECT
  USING (
    is_hidden = FALSE
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Usuarios autenticados y no baneados pueden crear reseñas (solo a su nombre)
CREATE POLICY "reviews_insert_authenticated"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

-- Usuarios pueden editar sus propias reseñas
CREATE POLICY "reviews_update_own"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden borrar sus reseñas; admins pueden borrar cualquiera
CREATE POLICY "reviews_delete_own_or_admin"
  ON public.reviews FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

**Script 11: RLS para `reports`**
```sql
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Usuarios autenticados y no baneados pueden crear reportes
CREATE POLICY "reports_insert_authenticated"
  ON public.reports FOR INSERT
  WITH CHECK (
    auth.uid() = reported_by
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = TRUE
    )
  );

-- Solo admins pueden ver reportes
CREATE POLICY "reports_select_admin"
  ON public.reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Solo admins pueden moderar (actualizar) reportes
CREATE POLICY "reports_update_admin"
  ON public.reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Paso 2.7: Hacerte admin a ti mismo

Después de registrarte como primer usuario, ejecuta en SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE display_name = 'TU_NOMBRE';
-- O si conoces tu user id:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'tu-uuid-aqui';
```

### Resumen visual del flujo de datos

```
Usuario se registra → auth.users (INSERT) → trigger → profiles (INSERT automático)
Usuario crea baño → bathrooms (INSERT, RLS verifica auth + no banned)
Usuario crea reseña → reviews (INSERT) → trigger → bathrooms (UPDATE medias)
Usuario reporta → reports (INSERT) → trigger → reviews (UPDATE is_hidden=true)
Admin aprueba → reports (UPDATE status) + reviews (UPDATE is_hidden=false)
Admin elimina → reports (UPDATE status) + reviews (DELETE) → trigger → bathrooms (UPDATE medias)
Admin banea → profiles (UPDATE is_banned=true) → plugin frontend hace signOut()
```

---

## Fase 3: Tipos TypeScript

Crear `types/index.ts` con interfaces: `Profile`, `Bathroom`, `BathroomType`, `Review`, `Report`, `NominatimResult`

---

## Fase 4: Composables

| Composable | Responsabilidad |
|---|---|
| `useAuth` | Login email/Google, register, logout, perfil, isAdmin, isBanned |
| `useBathrooms` | Fetch todos, crear baño |
| `useReviews` | Fetch por baño, crear, reportar, historial usuario |
| `useGeolocation` | Posición del usuario via browser API |
| `useNominatim` | Búsqueda de direcciones/POI con debounce |
| `useModeration` | Reportes pendientes, aprobar, eliminar, banear |
| `useProfile` | Actualizar nombre, cambiar contraseña |

---

## Fase 5: UI y Componentes

### Layout (`layouts/default.vue`)
- `h-screen flex flex-col overflow-hidden` → sin scroll
- Navbar arriba, `<slot>` ocupa el resto con `flex-1`

### Navbar (`components/app/Navbar.vue`)
- Izquierda: logo + "My Poop"
- Derecha: botones Login/Register (si no auth) o dropdown con perfil/logout (si auth)

### Mapa (`components/map/MapView.vue`)
- Leaflet a pantalla completa con tiles de OpenStreetMap
- Marker azul para ubicación del usuario (fuera del cluster group)
- Markers de baños gestionados por `leaflet.markercluster` (ver Fase 12 para detalle)
- Tooltip en cada marker (nombre + rating)
- Click en marker → abre `BathroomDetailModal`

### SearchBox (`components/map/SearchBox.vue`)
- Posición absoluta top-left sobre el mapa
- Input con debounce → llama Nominatim → muestra dropdown de resultados
- Al seleccionar resultado → `map.flyTo(latLng)`

### BathroomDetailModal (`components/bathroom/BathroomDetailModal.vue`)
- Modal grande: dos columnas en desktop, stacked en mobile
- Izquierda: info del baño (nombre, dirección, tipo, accesibilidad, horario, indicaciones, media de rollitos)
- Derecha: lista de reseñas + formulario para nueva reseña (si autenticado)

### ToiletPaperRating (`components/review/ToiletPaperRating.vue`)
- 5 iconos de rollito de papel higiénico
- Interactivo (hover + click) o readonly
- `v-model` compatible

### Auth Modals
- `LoginModal.vue`: email/password + botón Google + link a registro
- `RegisterModal.vue`: nombre + email/password + botón Google + link a login

### Perfil (`pages/profile.vue`)
- Tabs: Info | Contraseña | Mis Reseñas | Moderación (solo admin)
- `ProfileInfo`: nombre editable
- `PasswordChange`: formulario cambio contraseña
- `ReviewHistory`: lista de reseñas del usuario
- `ModerationPanel`: reportes pendientes con acciones (aprobar/eliminar/banear)

---

## Fase 6: API Routes del Servidor

Solo para operaciones admin que necesitan service role key:
- `GET /api/admin/reports` → reportes pendientes con joins
- `POST /api/admin/approve` → unhide review + reject report
- `POST /api/admin/delete` → delete review + approve report
- `POST /api/admin/ban` → set is_banned = true

Cada ruta verifica que el usuario es admin via JWT.

---

## Fase 7: i18n

- Crear `i18n/locales/en.json` con todas las claves de la app
- Crear `i18n/locales/es.json` (inicialmente copia, luego generar con `jsontt`)
- Usar `$t('key')` en todos los componentes

---

## Fase 8: Middleware

- `auth.ts`: redirige a `/` si no hay usuario autenticado
- `admin.ts`: redirige a `/` si el usuario no es admin

---

## Fase 9: Verificación de Usuario Baneado

En `app.vue` o plugin: tras resolver auth, si `is_banned = true` → hacer signOut() y mostrar notificación.

---

## Fase 10: Capacitor (Mobile) - Guía detallada

### Paso 10.1: Instalar Capacitor
```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init "My Poop" "com.mypoop.app" --web-dir .output/public
```
Esto crea `capacitor.config.ts` en la raíz del proyecto.

### Paso 10.2: Configurar `capacitor.config.ts`
```typescript
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mypoop.app',
  appName: 'My Poop',
  webDir: '.output/public',
  // En desarrollo, descomenta para conectar al dev server local:
  // server: {
  //   url: 'http://192.168.X.X:3000',  // tu IP local (no localhost)
  //   cleartext: true
  // }
}

export default config
```

### Paso 10.3: Añadir plataformas
```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```
Esto crea las carpetas `android/` e `ios/` con los proyectos nativos.

### Paso 10.4: Instalar plugins nativos necesarios
```bash
# Geolocalización nativa (más precisa que la del browser)
npm install @capacitor/geolocation

# Para manejar deep links (necesario para OAuth callback)
npm install @capacitor/app

# Sincronizar plugins con los proyectos nativos
npx cap sync
```

### Paso 10.5: Configuración Android

**Archivo: `android/app/src/main/AndroidManifest.xml`**

Añadir estos permisos ANTES de la etiqueta `<application>`:
```xml
<!-- Permisos de geolocalización -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<!-- Permiso de internet (normalmente ya está) -->
<uses-permission android:name="android.permission.INTERNET" />
```

Dentro de la etiqueta `<activity>`, añadir intent-filter para deep links (OAuth):
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="com.mypoop.app" />
</intent-filter>
```

**Archivo: `android/variables.gradle`** - verificar que `minSdkVersion` sea al menos 22:
```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
}
```

### Paso 10.6: Configuración iOS

**Archivo: `ios/App/App/Info.plist`**

Añadir descripción de uso de ubicación (obligatorio por Apple):
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>My Poop needs your location to show bathrooms near you</string>
```

Para deep links (OAuth), añadir URL scheme:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.mypoop.app</string>
    </array>
  </dict>
</array>
```

### Paso 10.7: Adaptar `useGeolocation.ts` para Capacitor

```typescript
// composables/useGeolocation.ts
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export const useGeolocation = () => {
  const coords = ref<{ lat: number; lng: number } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const getCurrentPosition = async () => {
    loading.value = true
    try {
      if (Capacitor.isNativePlatform()) {
        // En app nativa: usar plugin de Capacitor (pide permisos nativos)
        const permission = await Geolocation.requestPermissions()
        if (permission.location === 'granted') {
          const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true })
          coords.value = { lat: position.coords.latitude, lng: position.coords.longitude }
        } else {
          error.value = 'Location permission denied'
        }
      } else {
        // En web: usar API del browser
        navigator.geolocation.getCurrentPosition(
          (position) => {
            coords.value = { lat: position.coords.latitude, lng: position.coords.longitude }
          },
          (err) => { error.value = err.message },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { coords, error, loading, getCurrentPosition }
}
```

### Paso 10.8: Adaptar OAuth para Capacitor

En la app nativa, el redirect de OAuth no puede ir a `localhost`. Hay que configurar Supabase para que redirija al URL scheme de la app:

1. En **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**, añadir: `com.mypoop.app://callback`

2. En el composable `useAuth.ts`, detectar plataforma:
```typescript
const loginWithGoogle = async () => {
  const redirectTo = Capacitor.isNativePlatform()
    ? 'com.mypoop.app://callback'
    : `${window.location.origin}/confirm`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  })
  if (error) throw error
}
```

3. Crear un plugin que escuche deep links y complete el OAuth:
```typescript
// plugins/capacitor-deeplinks.client.ts
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const supabase = useSupabaseClient()

  App.addListener('appUrlOpen', async ({ url }) => {
    // url será algo como: com.mypoop.app://callback#access_token=xxx&refresh_token=yyy
    if (url.includes('callback')) {
      const params = new URLSearchParams(url.split('#')[1])
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      }
    }
  })
})
```

### Paso 10.9: Flujo de build y testing

**Desarrollo (con hot-reload en dispositivo/emulador):**
```bash
# 1. Arranca el dev server de Nuxt
npm run dev

# 2. En capacitor.config.ts, descomenta server.url con tu IP local
# 3. Sincroniza y abre IDE nativo
npx cap sync
npx cap open android   # abre Android Studio
npx cap open ios       # abre Xcode
# 4. En el IDE nativo, dale a Run/Play para instalar en emulador o dispositivo
```

**Build de producción:**
```bash
# 1. Genera la versión estática (SSG)
npx nuxi generate

# 2. Sincroniza los archivos web con los proyectos nativos
npx cap sync

# 3. Abre el IDE y genera el build de release
npx cap open android
# En Android Studio: Build → Generate Signed Bundle / APK
# Necesitas crear un keystore si no tienes (Android Studio te guía)

npx cap open ios
# En Xcode: Product → Archive
# Necesitas un Apple Developer account ($99/año) para subir a App Store
# Para testing sin cuenta: puedes instalar en tu iPhone conectado por cable
```

**Testing rápido sin IDE (solo Android):**
```bash
# Build APK debug directamente desde terminal
cd android && ./gradlew assembleDebug
# El APK estará en: android/app/build/outputs/apk/debug/app-debug.apk
# Puedes instalarlo en un dispositivo conectado con:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Paso 10.10: Consideraciones importantes

- **SSR vs SSG para mobile:** Capacitor necesita archivos estáticos, por lo que usamos `npx nuxi generate` (SSG) en vez de `npx nuxi build` (SSR). Para web en Vercel seguimos usando SSR normal.
- **Añadir `android/` e `ios/` a `.gitignore`** es opcional. Si quieres reproducibilidad, commitéalos. Si prefieres regenerarlos, ignóralos.
- **Requisitos de software:**
  - Android: Android Studio + JDK 17+ + Android SDK 34
  - iOS: Xcode 15+ (solo macOS) + CocoaPods (`sudo gem install cocoapods`)
- **Para subir a Google Play:** necesitas una cuenta de desarrollador ($25, pago único)
- **Para subir a App Store:** necesitas Apple Developer Program ($99/año)

---

## Fase 11: Deploy en Vercel

1. Push a GitHub
2. Importar en Vercel (auto-detecta Nuxt 3)
3. Añadir variables de entorno: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. Actualizar URLs en Supabase Auth settings con el dominio de Vercel

---

## Fase 12: Marker Clustering (incluido en V1)

### ¿Qué problema resuelve?
Cuando tienes muchos baños (100, 500, 2000...) en el mapa, mostrar un marker por cada uno causa:
- **Problema visual:** los markers se superponen y no se puede clickar ninguno
- **Problema de rendimiento:** el navegador sufre renderizando cientos de elementos DOM

### ¿Cómo funciona?
`Leaflet.markerCluster` agrupa markers automáticamente según el nivel de zoom:

```
Zoom bajo (vista de un país/región):
  ┌─────────────────┐
  │  [47]    [23]   │  ← Clusters: círculos con el número de baños agrupados
  │                 │
  │     [12]        │
  └─────────────────┘

Zoom medio (vista de una ciudad):
  ┌─────────────────┐
  │  [8] [5]  [3]   │  ← Clusters más pequeños
  │    🚽            │  ← Algunos markers individuales ya visibles
  │  [7]  🚽   [4]  │
  └─────────────────┘

Zoom alto (vista de una calle):
  ┌─────────────────┐
  │  🚽  🚽    🚽   │  ← Todos los markers individuales visibles
  │    🚽           │
  │  🚽    🚽       │
  └─────────────────┘

Máximo zoom con markers superpuestos → "Spiderfy":
       🚽
      / | \          ← Los markers se abren en espiral
  🚽 ─ ● ─ 🚽        con líneas conectándolos al punto real
      \ | /
       🚽
```

### ¿Es difícil de implementar? No.
Son ~20 líneas de código extra respecto a markers normales. Merece la pena incluirlo desde el principio.

### Paso 12.1: Instalar dependencia
```bash
npm install leaflet.markercluster
npm install -D @types/leaflet.markercluster
```

### Paso 12.2: Implementación en `MapView.vue`

Sin clustering (lo que teníamos antes):
```vue
<!-- v-for simple - funciona pero no escala -->
<LMarker v-for="b in bathrooms" :key="b.id" :lat-lng="[b.latitude, b.longitude]" />
```

Con clustering:
```vue
<template>
  <div class="relative w-full h-full">
    <LMap ref="mapRef" :zoom="13" :center="mapCenter" class="w-full h-full z-0">
      <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <!-- El marker del usuario se queda fuera del cluster -->
      <LMarker v-if="userCoords" :lat-lng="[userCoords.lat, userCoords.lng]">
        <LIcon icon-url="/markers/user-location.svg" :icon-size="[20, 20]" />
      </LMarker>
      <!-- Los markers de baños NO se renderizan con v-for, se gestionan por el cluster group -->
    </LMap>
    <SearchBox class="absolute top-4 left-4 z-10" @select="flyTo" />
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const mapRef = ref()
const { bathrooms } = useBathrooms()

// Crear el cluster group una vez
const clusterGroup = L.markerClusterGroup({
  maxClusterRadius: 60,      // píxeles - radio para agrupar markers
  spiderfyOnMaxZoom: true,   // expandir en espiral al máximo zoom
  showCoverageOnHover: false, // no mostrar área del cluster al hover
  zoomToBoundsOnClick: true,  // zoom al clickar un cluster
})

// Cuando el mapa y los baños estén listos, poblar el cluster
watch([() => mapRef.value?.leafletObject, bathrooms], ([map, baths]) => {
  if (!map || !baths.length) return

  clusterGroup.clearLayers()

  baths.forEach((b) => {
    const marker = L.marker([b.latitude, b.longitude], {
      icon: L.icon({
        iconUrl: '/markers/bathroom-marker.svg',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
    })
    marker.bindTooltip(`${b.name} - ${b.avg_rating.toFixed(1)} 🧻`)
    marker.on('click', () => openBathroomDetail(b))
    clusterGroup.addLayer(marker)
  })

  map.addLayer(clusterGroup)
}, { immediate: true })
</script>
```

### Paso 12.3: Personalizar estilo de clusters (opcional)

Podemos personalizar los colores de los clusters en `assets/css/main.css` para que encajen con el dark theme:
```css
/* Clusters pequeños (< 10 markers) */
.marker-cluster-small {
  background-color: rgba(139, 92, 42, 0.6);  /* marrón claro */
}
.marker-cluster-small div {
  background-color: rgba(139, 92, 42, 0.8);
}

/* Clusters medianos (10-100) */
.marker-cluster-medium {
  background-color: rgba(185, 120, 50, 0.6);  /* ámbar */
}
.marker-cluster-medium div {
  background-color: rgba(185, 120, 50, 0.8);
}

/* Clusters grandes (100+) */
.marker-cluster-large {
  background-color: rgba(220, 150, 60, 0.6);  /* dorado */
}
.marker-cluster-large div {
  background-color: rgba(220, 150, 60, 0.8);
}
```

### Resumen
- No añade complejidad significativa (1 dependencia, ~20 líneas de código)
- Resuelve problemas de rendimiento y usabilidad desde el día 1
- Funciona automáticamente: tú solo añades markers al grupo y el plugin hace el resto
- Se puede personalizar el estilo de los clusters para que encaje con la app

---

## Fase 13: Testing con Playwright MCP

### ¿Qué es?
Usar el MCP de Playwright (browser automation) directamente desde Claude Code para navegar la app, interactuar con elementos, y detectar bugs en tiempo real. No escribimos archivos de test — Claude controla el navegador directamente.

### ¿Por qué?
- Permite debuggear problemas de UI que no se ven en el código (clicks que no responden, modales que no abren, formularios que fallan silenciosamente)
- Claude puede ver el estado real del DOM, consola del navegador y red
- Más rápido que pedir al usuario que pruebe y reporte cada error

### Plan de testing (orden de ejecución)

**Test 1: Auth flow**
1. Navegar a `http://localhost:3001`
2. Click "Log In" → verificar que se abre el modal
3. Introducir credenciales → verificar login exitoso
4. Verificar que el navbar cambia (muestra avatar/dropdown)
5. Logout → verificar que vuelve al estado inicial

**Test 2: Mapa**
1. Verificar que el mapa carga con tiles de OpenStreetMap
2. Verificar que aparece el botón `+` (solo si logueado)
3. Click en `+` → verificar que se abre el formulario de baño

**Test 3: Crear baño**
1. Rellenar formulario con datos de test
2. Click "Use my location" → verificar que se rellenan lat/lng
3. Submit → verificar que no hay error y el modal se cierra
4. Verificar que aparece el marker en el mapa

**Test 4: Review flow**
1. Click en un marker de baño → verificar que se abre BathroomDetailModal
2. Rellenar formulario de review (rollitos + comentario)
3. Submit → verificar que la review aparece en la lista
4. Verificar que los promedios del baño se actualizan

**Test 5: Moderación (admin)**
1. Reportar una review → verificar que se oculta
2. Ir a `/profile` → tab Moderación
3. Verificar que aparece el reporte pendiente
4. Aprobar/eliminar → verificar que funciona

**Test 6: Edge cases**
1. Intentar crear dos reviews para el mismo baño → verificar error
2. Verificar i18n (cambiar idioma)
3. Verificar responsive (viewport mobile)

---

## Orden de implementación recomendado

1. **Fases 1-2-3** → Base: scaffolding + Supabase + tipos
2. **Fase 4** → Composables
3. **Fases 5+12** → UI + Clustering
4. **Fases 6-7-8-9** → Server routes, i18n, middleware, banned check
5. **Fase 13** → Testing con Playwright MCP (antes de deploy)
6. **Fase 10** → Capacitor
7. **Fase 11** → Deploy Vercel

---

## Verificación

- [ ] Auth: registro email, login email, login Google, logout, redirección OAuth
- [ ] Mapa: carga completa, ubicación usuario, markers de baños, búsqueda Nominatim
- [ ] Baños: crear baño, ver detalle en modal, datos correctos
- [ ] Reseñas: crear reseña con rollitos, ver lista en modal, una por usuario por baño
- [ ] Reportes: reportar reseña → se oculta, admin ve en panel
- [ ] Moderación: aprobar (unhide), eliminar, banear usuario
- [ ] Banned: usuario baneado no puede loguearse
- [ ] i18n: cambiar idioma funciona en toda la app
- [ ] Responsive: modal se adapta a mobile
- [ ] Vercel: deploy funcional con env vars
- [ ] Capacitor: build genera app funcional
