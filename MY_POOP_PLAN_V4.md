# My Poop V4 — Baño más cercano + Capacitor Android

## Contexto

Con las fases V1-V3 completadas, esta fase añade el **botón de urgencia** (ya implementado) y empaqueta la app con **Capacitor para Android**, manteniendo **SSR para web** y **SPA para Capacitor**.

**Stack actual:** Nuxt 3 + Vue 3 | Nuxt UI v3 + Tailwind | Supabase | Leaflet + OSM | Capacitor (deps instaladas, sin configurar)

**Decisiones:**
- SSR se mantiene para la versión web (SEO, meta tags)
- Build Capacitor usa `nuxt generate` (SPA estática) con variable de entorno
- iOS se pospone — solo Android por ahora

---

## Fase 1: Botón de urgencia — Baño más cercano [COMPLETADA]

- `utils/haversine.ts` — distancia Haversine + formateo
- `composables/useNearestBathroom.ts` — busca el más cercano en memoria, abre navegación GPS
- `components/map/NearestBathroomButton.vue` — botón rojo SOS en el mapa
- Integrado en `MapView.vue` encima del botón de añadir baño
- Traducciones en/es añadidas

---

## Fase 2: Configurar Capacitor para Android

### ¿Qué hace?
Empaqueta la app Nuxt como APK/AAB nativo para Android usando Capacitor, manteniendo el SSR intacto para la versión web.

### Requisitos previos [COMPLETADOS]

- [x] Android Studio instalado
- [x] Android SDK descargado
- [x] Command-line Tools instaladas
- [x] Licencias SDK aceptadas
- [x] Java (Temurin) instalado
- [ ] `ANDROID_HOME` configurado en `~/.zshrc`

Falta configurar `ANDROID_HOME`. Ejecutar:
```bash
echo '\nexport ANDROID_HOME=$HOME/Library/Android/sdk\nexport PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc && source ~/.zshrc
```

### Paso 2.1: SSR condicional (web = SSR, Capacitor = SPA)

En `nuxt.config.ts`:
```ts
ssr: process.env.CAPACITOR !== 'true',
```

Esto permite:
- `npm run dev` / `npm run build` → SSR normal para web
- `CAPACITOR=true nuxt generate` → SPA estática para Capacitor

### Paso 2.2: Crear `capacitor.config.ts`

```ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mypoop.app',
  appName: 'My Poop',
  webDir: '.output/public',
  plugins: {
    Geolocation: {},
  },
}

export default config
```

### Paso 2.3: Actualizar `useGeolocation.ts` para Capacitor

Cambiar de la API del navegador al plugin de Capacitor cuando corre en nativo:

```ts
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export const useGeolocation = () => {
  const coords = ref<{ lat: number; lng: number } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const getCurrentPosition = async () => {
    loading.value = true
    error.value = null
    try {
      if (Capacitor.isNativePlatform()) {
        const permission = await Geolocation.requestPermissions()
        if (permission.location !== 'granted') {
          error.value = 'Location permission denied'
          return
        }
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        })
        coords.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
      } else {
        // Fallback web
        return new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              coords.value = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              }
              resolve()
            },
            (err) => {
              error.value = err.message
              resolve()
            },
            { enableHighAccuracy: true, timeout: 10000 },
          )
        })
      }
    } catch (e: any) {
      error.value = e.message ?? 'Failed to get location'
    } finally {
      loading.value = false
    }
  }

  return { coords, error, loading, getCurrentPosition }
}
```

### Paso 2.4: Scripts en `package.json`

```json
"scripts": {
  "dev": "nuxt dev",
  "build": "nuxt build",
  "generate": "nuxt generate",
  "build:cap": "CAPACITOR=true nuxt generate",
  "cap:sync": "npm run build:cap && npx cap sync",
  "cap:android": "npm run cap:sync && npx cap open android",
  "cap:run:android": "npm run cap:sync && npx cap run android"
}
```

### Paso 2.5: Generar proyecto Android

```bash
# Generar build estático
npm run build:cap

# Crear el proyecto Android
npx cap add android

# Sincronizar
npx cap sync
```

Esto crea el directorio `android/` (ya está en `.gitignore`).

### Paso 2.6: Configurar permisos Android

En `android/app/src/main/AndroidManifest.xml`, verificar que incluya:
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

> Nota: `@capacitor/geolocation` ya añade los permisos de location automáticamente al hacer `cap sync`. Solo verificar que estén.

### Archivos a crear
- `capacitor.config.ts`

### Archivos a modificar
- `nuxt.config.ts` — SSR condicional con `process.env.CAPACITOR`
- `package.json` — scripts de Capacitor
- `composables/useGeolocation.ts` — soporte nativo con fallback web

**Complejidad:** Media (~1-2h)

---

## Fase 3: Probar en tu teléfono Android

### Método A: USB directo (recomendado)

#### 1. Activar "Opciones de desarrollador" en tu Android

Solo se hace una vez:

1. **Ajustes** → **Acerca del teléfono**
2. Toca **Número de compilación** 7 veces seguidas
3. Aparece: "Ahora eres desarrollador"

#### 2. Activar "Depuración USB"

1. **Ajustes** → **Opciones de desarrollador**
2. Activa **Depuración USB**
3. Si aparece "Instalación por USB", actívala también

#### 3. Conectar al Mac

1. Conecta con cable USB **de datos** (no todos los cables sirven)
2. En el teléfono: **"¿Permitir depuración USB?"** → marca "Siempre" → **Aceptar**

#### 4. Verificar conexión

```bash
adb devices
# Debe mostrar:
# List of devices attached
# XXXXXXXX    device
```

#### 5. Ejecutar la app

```bash
# Opción A: todo de un comando
npm run cap:run:android

# Opción B: abrir en Android Studio
npm run cap:android
# En Android Studio: selecciona tu teléfono → pulsa ▶ (Run)
# Primera vez tarda ~5min por Gradle sync
```

### Método B: Live Reload (desarrollo rápido)

Para ver cambios en tiempo real sin rebuilds:

#### 1. Obtener tu IP local

```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Busca algo como: 192.168.1.XX
```

#### 2. Configurar Live Reload

Editar `capacitor.config.ts` **temporalmente**:
```ts
const config: CapacitorConfig = {
  appId: 'com.mypoop.app',
  appName: 'My Poop',
  webDir: '.output/public',
  server: {
    url: 'http://192.168.1.XX:3000',  // <-- tu IP local
    cleartext: true,
  },
}
```

#### 3. Ejecutar

```bash
# Terminal 1: servidor Nuxt accesible en la red local
npm run dev -- --host

# Terminal 2: sincronizar y lanzar en Android
npx cap sync && npx cap run android
```

El teléfono carga la app desde tu Mac por WiFi. Hot reload incluido.

> **IMPORTANTE:** Quita la sección `server` de `capacitor.config.ts` antes de hacer builds de producción.

### Método C: Emulador Android (sin teléfono)

1. Android Studio → **Tools** → **Device Manager**
2. **Create Virtual Device** → elige un modelo (ej. Pixel 7)
3. Descarga un system image (ej. API 34 - Android 14)
4. **Finish** → ejecuta la app con ▶

### Troubleshooting

| Problema | Solución |
|---|---|
| `adb devices` vacío | Prueba otro cable USB (muchos solo cargan) |
| "unauthorized" | Revoca autorizaciones USB en Opciones de desarrollador → reconecta |
| "SDK not found" | Configura `ANDROID_HOME` en `~/.zshrc` |
| Gradle sync falla | Android Studio → File → Sync Project with Gradle Files |
| App crashea al abrir | Ejecuta `adb logcat` para ver el error |
| No detecta ubicación | Ajustes → Apps → My Poop → Permisos → Ubicación |

---

## Orden de implementación

1. ~~**Fase 1** → Botón de urgencia~~ [COMPLETADA]
2. **Fase 2** → Configurar Capacitor (crear config, SSR condicional, useGeolocation)
3. **Fase 3** → Probar en Android (USB o Live Reload)

---

## Después de V4

- Deploy web en Vercel (SSR para SEO)
- Publicar en Google Play Store
- Añadir soporte iOS con Capacitor
- Push notifications (Firebase Cloud Messaging)
- Gamificación (badges, leaderboard)
- Monetización (AdMob + baños destacados)
