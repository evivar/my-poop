# My Poop — Plan técnico: Re-integración de Capacitor + APK Android

Plan para volver a añadir Capacitor al proyecto después de haber hecho una limpieza completa en favor de PWA.
La PWA cubre iOS y web. Este plan añade el canal de Android nativo (APK vía GitHub Releases).

**Objetivo:** tener un APK firmado distribuible en GitHub Releases que los usuarios de Android puedan descargar e instalar directamente, sin pasar por la Play Store.

---

## Por qué vale la pena el esfuerzo

La PWA ya cubre el **90% de lo que ofrece la versión nativa**:
- Geolocalización: `navigator.geolocation` funciona en Chrome Android igual que en nativo.
- Share: Web Share API dispara el share sheet nativo del SO en Chrome Android.
- Instalación: `Add to Home Screen` en Android Chrome da experiencia casi idéntica a una app instalada.

**Lo que sí añade el APK nativo:**
1. **Credibilidad percibida** — "descarga la app" suena más serio que "añade al home screen". Importante para Reddit/HackerNews donde la gente busca excusas para desconfiar.
2. **Cámara nativa** — `@capacitor/camera` llama directamente a la cámara del SO con control de calidad de imagen, sin los hacks de `<input capture="environment">` que en algunos Android tienen bugs.
3. **Geolocalización con warm-up** — el plugin nativo tiene mejor latencia en la primera petición de GPS en algunos dispositivos.
4. **Sin limitaciones del browser** — no hay prompt de "¿permitir ubicación?" del navegador encima del propio prompt del SO.

**Lo que NO ofrece el APK sin esfuerzo adicional:**
- Auto-update: el APK side-loaded no se auto-actualiza. El usuario tiene que re-descargar.
- Play Store protection: sin firma de producción en Play Store no hay protección de firma rollback.
- iOS: APK solo existe para Android. Para iOS, la PWA es la estrategia. Punto.

---

## Tabla de prioridades

| # | Fase | Esfuerzo | Bloquea APK | Impacto |
|---|------|----------|-------------|---------|
| 1 | Re-instalar Capacitor y configuración base | ~30 min | SÍ | Alto |
| 2 | Re-añadir branches nativos en composables | ~1-2h | SÍ | Alto |
| 3 | Build Android APK | ~1h | SÍ | Alto |
| 4 | GitHub Releases + CI/CD | ~1h | NO (opcional) | Alto (comodidad) |
| 5 | Banner "Install PWA" para iOS | ~30 min | NO | Alto (UX iOS) |

**Total estimado:** ~4-6h para tener el primer APK de debug en mano. ~6-8h para CI/CD, APK firmado y banner iOS.

---

## Fase 1: Re-instalar Capacitor y configuración base

**Tiempo estimado:** ~30 min

### 1.1 Instalar dependencias

```bash
npm install @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli

# Plugins nativos que necesitamos
npm install @capacitor/camera @capacitor/geolocation @capacitor/share @capacitor/app
```

**Versiones recomendadas:** Capacitor 6.x (última estable a la fecha del plan). Verificar compatibilidad con `@capacitor/android` antes de instalar:

```bash
# Verificar que todo queda en la misma major
npx cap --version
```

> **Advertencia:** Capacitor 6 requiere Android SDK compileSdkVersion 34 y Gradle 8+. Android Studio Hedgehog (2023.1) o posterior cubre esto.

### 1.2 Re-crear `capacitor.config.ts`

Crear el archivo en el root del proyecto:

```ts
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mypoop.app',
  appName: 'My Poop',
  webDir: '.output/public',  // nuxt generate emite aquí con static output
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Geolocation: {
      // Android: pedir permisos precisos (GPS fino, no solo red)
      // Si el usuario lo deniega, caemos al branch web (navigator.geolocation)
    },
    Camera: {
      // Calidad de imagen para subidas: reducimos a 80% para no explotar Supabase Storage
      // Se puede subir a 90-95% cuando tengamos optimización de imágenes.
    },
  },
}

export default config
```

> **Nota sobre `webDir`:** Nuxt genera el static output en `.output/public` cuando corres `nuxt generate`. Capacitor toma ese directorio y lo copia dentro de `android/app/src/main/assets/public/`. Hay que asegurarse de correr `nuxt generate` **antes** de `cap sync`.

### 1.3 Inicializar Capacitor y añadir Android

```bash
# Init: detecta package.json para leer el nombre/appId
npx cap init "My Poop" "com.mypoop.app" --web-dir .output/public

# Añadir la plataforma Android
npx cap add android
```

Esto crea el directorio `android/` en el root del proyecto. Este directorio es un proyecto Gradle estándar que Android Studio puede abrir directamente.

### 1.4 Re-añadir scripts en `package.json`

Añadir al objeto `"scripts"` en `package.json`:

```json
{
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "seed:osm": "tsx scripts/seed-osm.ts",
    "build:cap": "CAPACITOR=true nuxt generate",
    "cap:sync": "npx cap sync android",
    "cap:android": "npx cap open android",
    "cap:run:android": "npx cap run android"
  }
}
```

**Qué hace cada script:**
- `build:cap` — genera el static bundle con `CAPACITOR=true` para que el SSR quede desactivado (necesario para Capacitor, el WebView no tiene servidor Node).
- `cap:sync` — copia `.output/public` → `android/app/src/main/assets/public/` y sincroniza plugins.
- `cap:android` — abre el proyecto en Android Studio.
- `cap:run:android` — compila y lanza en emulador/dispositivo conectado por USB (requiere `adb`).

### 1.5 Re-añadir la condición SSR en `nuxt.config.ts`

Cambiar la línea `ssr: true` por:

```ts
// nuxt.config.ts
ssr: process.env.CAPACITOR !== 'true',
```

**Por qué:** Capacitor sirve la app como archivos estáticos dentro del WebView de Android. No hay servidor Node corriendo. Por lo tanto, la app debe ser 100% client-side rendered (SSR desactivado). Cuando `CAPACITOR=true`, `nuxt generate` produce un SPA completo. La versión de Vercel mantiene `ssr: true` para SEO.

### 1.6 Re-añadir `android/` e `ios/` en `.gitignore`

Añadir al final de `.gitignore`:

```
# Capacitor native projects
# El directorio android/ se regenera con `npx cap add android` + `npx cap sync`
# No tiene sentido versionar miles de archivos Gradle generados.
android/
ios/
```

> **Decisión de arquitectura:** No se versiona el directorio `android/`. El CI/CD lo regenera en cada build con `npx cap add android && npx cap sync`. Esto evita conflictos de merge en archivos Gradle autogenerados y mantiene el repo limpio.

---

## Fase 2: Re-añadir branches nativos en composables

**Tiempo estimado:** ~1-2h

Esta es la fase más delicada. Hay que hacer que los composables detecten si están corriendo en contexto nativo (dentro del WebView de Capacitor) o en el navegador, y usar la API correcta.

**Regla de oro:** siempre intentar el branch nativo primero, caer al browser API como fallback. Así el mismo código funciona en web y en APK.

### 2.1 `composables/useGeolocation.ts` — añadir branch nativo

El archivo actual usa solo `navigator.geolocation`. Hay que añadir el branch de `@capacitor/geolocation`:

```ts
// composables/useGeolocation.ts
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

export const useGeolocation = () => {
  const coords = ref<{ lat: number, lng: number } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const getCurrentPosition = async () => {
    loading.value = true
    error.value = null
    try {
      // Branch nativo: Capacitor WebView en Android/iOS
      if (Capacitor.isNativePlatform()) {
        // Pedir permisos antes de la primera llamada
        const permission = await Geolocation.requestPermissions()
        if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
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
        return
      }

      // Branch web: navegador estándar (PWA, desktop, etc.)
      if (!navigator.geolocation) {
        error.value = 'Geolocation is not supported'
        return
      }
      await new Promise<void>((resolve) => {
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
    catch (e: any) {
      error.value = e.message ?? 'Failed to get location'
    }
    finally {
      loading.value = false
    }
  }

  return { coords, error, loading, getCurrentPosition }
}
```

**Permisos en AndroidManifest.xml** — Capacitor los añade automáticamente al hacer `cap sync`, pero verificar que estén en `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

### 2.2 `composables/useShare.ts` — añadir branch nativo

```ts
// composables/useShare.ts
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

export type ShareOptions = {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
}

export type ShareResult = 'shared' | 'copied' | 'cancelled'

const isUserCancel = (e: any) => {
  const msg = e?.message ?? ''
  return /cancel/i.test(msg) || /abort/i.test(msg) || /share canceled/i.test(msg)
}

export const useShare = () => {
  const share = async (options: ShareOptions): Promise<ShareResult> => {
    // Branch nativo: @capacitor/share dispara el share sheet del SO directamente
    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle,
        })
        return 'shared'
      }
      catch (e: any) {
        if (isUserCancel(e)) return 'cancelled'
        // Caer al branch web si el plugin falla por alguna razón
      }
    }

    // Branch web: Web Share API (disponible en mobile Safari y Chrome modernos)
    if (typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function') {
      try {
        await (navigator as any).share(options)
        return 'shared'
      }
      catch (e: any) {
        if (isUserCancel(e)) return 'cancelled'
      }
    }

    // Fallback: copiar al portapapeles
    const fallbackText = [options.text, options.url].filter(Boolean).join('\n')
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fallbackText)
      return 'copied'
    }

    return 'cancelled'
  }

  return { share }
}
```

### 2.3 Re-crear `composables/usePhotoCapture.ts`

Este composable fue eliminado cuando se quitó Capacitor. Hay que recrearlo. Su responsabilidad: tomar una foto desde la cámara nativa (no desde un `<input type="file">`). Lo usa `PhotoUploader.vue` en modo nativo.

```ts
// composables/usePhotoCapture.ts
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export type CaptureResult = {
  file: File
  preview: string
}

export const usePhotoCapture = () => {
  const error = ref<string | null>(null)

  const capturePhoto = async (): Promise<CaptureResult | null> => {
    if (!Capacitor.isNativePlatform()) {
      // En web, este composable no se usa. PhotoUploader.vue usa <input type="file">.
      error.value = 'Native camera not available on web'
      return null
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        // Redimensionar para no exceder el límite de 5 MB de Supabase Storage
        width: 1280,
        height: 1280,
        correctOrientation: true,
      })

      if (!photo.dataUrl) {
        error.value = 'No photo data received'
        return null
      }

      // Convertir dataUrl a File para que sea compatible con el flujo de subida existente
      const res = await fetch(photo.dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })

      return { file, preview: photo.dataUrl }
    }
    catch (e: any) {
      if (/cancel/i.test(e?.message ?? '')) return null  // usuario canceló
      error.value = e.message ?? 'Failed to capture photo'
      return null
    }
  }

  return { capturePhoto, error }
}
```

**Permisos de cámara en AndroidManifest.xml** — Capacitor los añade automáticamente, pero verificar:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### 2.4 Actualizar `components/ui/PhotoUploader.vue`

El componente actual usa solo `<input type="file" capture="environment">`. En nativo, añadir un botón que llame a `usePhotoCapture`:

```vue
<!-- Añadir en el <script setup> de PhotoUploader.vue -->
<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

// Composables existentes
const { validateImage } = usePhotoUpload()
const { t } = useI18n()

// Nuevo: captura nativa
const { capturePhoto } = usePhotoCapture()
const isNative = Capacitor.isNativePlatform()

// ... resto del script existente ...

const onNativeCapture = async () => {
  error.value = ''
  if (previews.value.length >= props.maxPhotos) return

  const result = await capturePhoto()
  if (!result) return

  validating.value = true
  const isValid = await validateImage(result.file)
  validating.value = false

  if (!isValid) {
    error.value = t('photos.rejected')
    return
  }

  previews.value.push({ url: result.preview, file: result.file })
  syncFiles()
}
</script>
```

Y en el template, mostrar el botón nativo o el input file según la plataforma:

```vue
<template>
  <!-- ... previews existentes ... -->

  <div v-if="previews.length < maxPhotos">
    <!-- Botón nativo (Android/iOS con Capacitor) -->
    <UButton
      v-if="isNative"
      icon="i-heroicons-camera"
      variant="outline"
      size="sm"
      @click="onNativeCapture"
    >
      {{ $t('photos.addPhoto') }}
    </UButton>

    <!-- Input file (web/PWA) -->
    <label v-else class="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 transition-colors text-sm text-gray-400">
      <UIcon name="i-heroicons-camera" />
      <span>{{ $t('photos.addPhoto') }}</span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        class="hidden"
        multiple
        @change="onFileSelect"
      />
    </label>
  </div>
</template>
```

### 2.5 Verificar `components/map/MapView.vue`

El componente de mapa llama a `useGeolocation` al montar. Con el nuevo composable con branch nativo, no debería requerir cambios en el template. Solo verificar que el timeout de 10s (ya configurado en `getCurrentPosition`) sea suficiente para Android (los primeros cold-starts de GPS pueden tardar hasta 8-9s).

Si hay un timeout más agresivo hard-coded en el componente (1.5s fue mencionado como diferencia), ajustarlo:

```ts
// En MapView.vue, si hay algo como:
// const GEOLOC_TIMEOUT = process.env.CAPACITOR === 'true' ? 10000 : 1500
// Simplificar a: usar el timeout del composable directamente
```

---

## Fase 3: Build Android APK

**Tiempo estimado:** ~1h (primera vez, incluyendo instalar Android Studio si no está)

### 3.1 Prerequisites

- **Android Studio** instalado (descarga en https://developer.android.com/studio)
- **Android SDK** con API Level 34 (Android 14) instalado desde Android Studio SDK Manager
- **Java 17** (viene con Android Studio, no hace falta instalar por separado)
- **ADB** (Android Debug Bridge): viene en el SDK, añadir al PATH:
  ```bash
  # macOS: añadir al ~/.zshrc
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/emulator
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

### 3.2 Flujo completo de build

```bash
# Paso 1: generar el static bundle de Nuxt con SSR desactivado
npm run build:cap
# equivale a: CAPACITOR=true nuxt generate
# output en: .output/public/

# Paso 2: sincronizar el bundle con el proyecto Android
npm run cap:sync
# equivale a: npx cap sync android
# copia .output/public/ → android/app/src/main/assets/public/
# instala plugins nativos que no estaban

# Paso 3: abrir en Android Studio para compilar
npm run cap:android
# equivale a: npx cap open android
# abre el proyecto Gradle en Android Studio
```

### 3.3 APK de debug (para pruebas rápidas)

Desde Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**

O desde CLI (si tienes Gradle en PATH):

```bash
cd android
./gradlew assembleDebug
# output: android/app/build/outputs/apk/debug/app-debug.apk
```

El APK de debug:
- Está firmado con la debug keystore de Android Studio (`~/.android/debug.keystore`).
- No requiere ninguna configuración adicional.
- Puede instalarse en cualquier Android con "Install unknown apps" habilitado.
- **No puede subirse a Play Store** (requiere firma de release).
- Perfecto para GitHub Releases y distribución directa.

### 3.4 APK de release (para distribución seria)

#### Generar el keystore de producción

```bash
keytool -genkey -v \
  -keystore mypoop-release-key.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias mypoop
```

Parámetros que pedirá:
- Keystore password: guardar en un password manager, **nunca perder esto**
- Key password: puede ser igual al keystore password
- First and Last Name, Organization, etc.: rellenar con datos reales

> **CRÍTICO:** Guardar `mypoop-release-key.jks` en un lugar seguro fuera del repo. Si se pierde esta keystore, **no se puede actualizar la app en Play Store nunca más**. Para distribución por GitHub Releases esto es menos catastrófico (los usuarios simplemente desinstalan y reinstalan), pero sigue siendo una mala práctica perderla.

> **NUNCA** subir el archivo `.jks` al repositorio de GitHub. Añadir a `.gitignore`:
> ```
> *.jks
> *.keystore
> ```

#### Configurar firma en el proyecto Android

Editar `android/app/build.gradle`:

```groovy
android {
    // ... configuración existente ...

    signingConfigs {
        release {
            storeFile file(System.getenv('KEYSTORE_PATH') ?: '../mypoop-release-key.jks')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS')
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false  // Capacitor no se lleva bien con R8 sin config extra
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Build del APK firmado

```bash
cd android

# Con variables de entorno para no hardcodear credenciales
KEYSTORE_PATH=../mypoop-release-key.jks \
KEYSTORE_PASSWORD=tu_password \
KEY_ALIAS=mypoop \
KEY_PASSWORD=tu_key_password \
./gradlew assembleRelease

# output: android/app/build/outputs/apk/release/app-release.apk
```

### 3.5 Probar en emulador y dispositivo real

**Emulador:**
```bash
# Listar emuladores disponibles
emulator -list-avds

# Lanzar emulador
emulator -avd Pixel_7_API_34

# Una vez corriendo, instalar el APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Dispositivo real por USB:**
```bash
# Verificar que el dispositivo está conectado y en modo debug
adb devices

# Instalar APK directamente
adb install android/app/build/outputs/apk/debug/app-debug.apk

# O usar cap run que hace todo en uno
npx cap run android
```

En el dispositivo Android: Settings > Security > Install unknown apps → habilitar para el navegador/explorador de archivos.

---

## Fase 4: GitHub Releases para distribución

**Tiempo estimado:** ~1h

### 4.1 Distribución manual (el mínimo viable)

1. Ir a GitHub → repo → **Releases > Draft a new release**
2. Crear un tag nuevo: `v1.0.0-android` o `v1.0.0`
3. Título: "My Poop v1.0.0 — Android APK"
4. En el body, explicar cómo instalar (ver sección 7 para el texto del Reddit post)
5. Subir el archivo `app-release.apk` como asset
6. Publicar el release

Los usuarios descargan el APK directamente desde la URL de GitHub, que es confiable y sin intermediarios.

### 4.2 GitHub Actions — Build automatizado

Esta es la parte clave para no tener que hacer el build manualmente cada vez.

#### Prerequisitos en GitHub Secrets

Ir a Settings > Secrets and variables > Actions y añadir:

| Secret | Valor |
|--------|-------|
| `KEYSTORE_BASE64` | `base64 -i mypoop-release-key.jks` (el .jks en base64) |
| `KEYSTORE_PASSWORD` | password del keystore |
| `KEY_ALIAS` | `mypoop` |
| `KEY_PASSWORD` | password de la key |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_ANON_KEY` | anon key pública de Supabase |

**Cómo convertir el keystore a base64:**
```bash
base64 -i mypoop-release-key.jks | tr -d '\n' | pbcopy
# Pegar el resultado en el secret KEYSTORE_BASE64
```

#### Workflow YAML

Crear el archivo `.github/workflows/android-release.yml`:

```yaml
name: Build Android APK

on:
  push:
    tags:
      - 'v*'        # Se dispara en cualquier tag v1.0.0, v1.2.3-beta, etc.
  workflow_dispatch:  # También permite lanzarlo manualmente desde la UI de GitHub

jobs:
  build-android:
    name: Build and release Android APK
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Set up Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: Build Nuxt static bundle (Capacitor mode)
        run: npm run build:cap
        env:
          CAPACITOR: 'true'
          NUXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NUXT_PUBLIC_SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      # Regenerar el proyecto Android (no está en el repo)
      - name: Install Capacitor CLI and add Android platform
        run: |
          npx cap add android
          npm run cap:sync

      # Restaurar el keystore desde el secret base64
      - name: Decode release keystore
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/mypoop-release-key.jks

      - name: Build release APK
        working-directory: android
        run: ./gradlew assembleRelease
        env:
          KEYSTORE_PATH: mypoop-release-key.jks
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Rename APK with version tag
        run: |
          VERSION=${GITHUB_REF_NAME:-dev}
          cp android/app/build/outputs/apk/release/app-release.apk \
             "my-poop-${VERSION}.apk"

      # Crear el GitHub Release y subir el APK automáticamente
      - name: Create GitHub Release and upload APK
        uses: softprops/action-gh-release@v2
        with:
          files: "my-poop-*.apk"
          generate_release_notes: true
          body: |
            ## My Poop Android APK

            ### Instalación
            1. Descarga el archivo `my-poop-${{ github.ref_name }}.apk`
            2. En tu Android: Ajustes → Seguridad → Instalar apps desconocidas → permitir desde tu navegador
            3. Abre el APK descargado e instala

            ### ¿Por qué no está en Play Store?
            Aún no. El APK directo es más rápido de distribuir durante el early access.
            Publicaremos en Play Store cuando tengamos suficiente feedback inicial.

            ### Web / PWA
            También disponible como PWA en https://mypoop.app — funciona en iOS y Android desde el navegador.
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 4.3 Estrategia de versioning con tags

```bash
# Versión de release
git tag v1.0.0
git push origin v1.0.0
# → GitHub Actions lanza el build automáticamente y crea el release con el APK

# Versión beta
git tag v1.1.0-beta.1
git push origin v1.1.0-beta.1

# Versión hotfix
git tag v1.0.1
git push origin v1.0.1
```

El tag dispara el workflow, Gradle compila el APK con la firma de release, y el action crea el GitHub Release con el APK adjunto. Sin intervención manual.

### 4.4 El problema de las auto-actualizaciones

**Los APKs side-loaded no se auto-actualizan.** El usuario instala v1.0.0 y se queda en v1.0.0 para siempre a menos que descargue el nuevo APK manualmente.

Opciones para mitigar:

1. **In-app update check** — Al arrancar la app, hacer fetch a la GitHub Releases API y comparar versiones:
   ```ts
   // plugins/versionCheck.client.ts
   const CURRENT_VERSION = '1.0.0'  // bumpearlo en cada release
   const res = await fetch('https://api.github.com/repos/tu-usuario/my-poop/releases/latest')
   const release = await res.json()
   const latestVersion = release.tag_name.replace('v', '')
   if (latestVersion !== CURRENT_VERSION) {
     // Mostrar toast: "Nueva versión disponible: v{latestVersion}"
     // Link al APK de la release
   }
   ```

2. **Capacitor Updater** (plugin de pago, Capgo) — Permite hotfixes sin reinstalar. No es necesario para el MVP.

3. **Play Store** (cuando tenga sentido) — La solución definitiva para auto-updates. Versión $25 one-time fee.

---

## Fase 5: Banner "Install PWA" para usuarios iOS

**Tiempo estimado:** ~30 min

> **Estrategia iOS:** NO usamos Capacitor para iOS. La PWA ya cubre todas las funcionalidades que necesitamos en Safari iOS (geolocalización, cámara vía `<input capture>`, Web Share API, modo standalone). En su lugar, detectamos que el usuario está en iOS y le mostramos un banner explicándole cómo instalar la PWA.

### Detección

Dos condiciones deben cumplirse para mostrar el banner:

1. **Es iOS:** `navigator.userAgent` contiene `iPhone` o `iPad` (o `navigator.platform` empieza por `iP`)
2. **NO está en modo standalone:** `window.matchMedia('(display-mode: standalone)').matches === false` (significa que NO está instalada aún como PWA)

Si ambas se cumplen → mostrar banner. Si el usuario lo descarta → guardar en `localStorage` y no volver a mostrarlo.

### Implementación

**Composable: `composables/useIosPwaPrompt.ts`**

```ts
export const useIosPwaPrompt = () => {
  const show = ref(false)

  onMounted(() => {
    // Solo en cliente, solo en iOS, solo si no está ya instalada
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true  // Safari legacy
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')

    if (isIos && !isStandalone && !dismissed) {
      show.value = true
    }
  })

  const dismiss = () => {
    show.value = false
    localStorage.setItem('pwa-prompt-dismissed', '1')
  }

  return { show, dismiss }
}
```

**Componente: `components/app/IosPwaPrompt.vue`**

```vue
<template>
  <Transition name="slide-up">
    <div
      v-if="show"
      class="fixed bottom-0 inset-x-0 z-50 bg-gray-800 border-t border-gray-700 px-4 py-3 flex items-center gap-3 shadow-lg"
    >
      <div class="flex-1 text-sm">
        <p class="font-medium text-white">{{ $t('pwa.installTitle') }}</p>
        <p class="text-gray-400 text-xs mt-0.5">
          {{ $t('pwa.installSteps') }}
        </p>
      </div>
      <UButton size="xs" variant="ghost" icon="i-heroicons-x-mark" @click="dismiss" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { show, dismiss } = useIosPwaPrompt()
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>
```

**Montar en `app.vue`** (dentro de `<UApp>`, después de los modals):

```vue
<IosPwaPrompt />
```

**Claves i18n:**

```json
// en.json
"pwa": {
  "installTitle": "Install My Poop",
  "installSteps": "Tap the Share button (□↑) then \"Add to Home Screen\""
}

// es.json
"pwa": {
  "installTitle": "Instalar My Poop",
  "installSteps": "Toca el botón Compartir (□↑) y luego \"Añadir a pantalla de inicio\""
}
```

### UX del banner

```
┌──────────────────────────────────────────────────┐
│ Install My Poop                              [✕] │
│ Tap the Share button (□↑) then                   │
│ "Add to Home Screen"                             │
└──────────────────────────────────────────────────┘
```

- Aparece fijo en la parte inferior de la pantalla (por encima del footer)
- Animación slide-up suave al aparecer
- Click en ✕ → se descarta y no vuelve a aparecer (localStorage)
- NO aparece si ya está instalada como PWA (detección de `standalone`)
- NO aparece en Android ni desktop (solo iOS)

### Por qué NO usamos Capacitor para iOS

| | Android (Capacitor) | iOS (PWA) |
|---|---|---|
| Coste | $0 | $0 |
| Distribución | APK vía GitHub | Safari → Add to Home Screen |
| Geolocalización | Plugin nativo | `navigator.geolocation` ✅ |
| Cámara | Plugin nativo | `<input capture>` ✅ |
| Share | Plugin nativo | Web Share API ✅ |
| Modo standalone | WebView nativo | PWA standalone ✅ |
| Auto-update | NO (re-descarga) | SÍ (automático en background) |
| Requiere cuenta dev | NO | NO |

**La PWA en iOS tiene una ventaja clave sobre Capacitor:** se auto-actualiza. Cada vez que el usuario abre la app, Safari descarga la última versión en background. Con un IPA via TestFlight, tendrías que subir builds manualmente cada 90 días.

**Conclusión:** Para iOS, el banner de instalación PWA es la estrategia correcta. Capacitor iOS se reserva para el día que necesites push notifications nativas o acceso a APIs de Apple que la PWA no cubre.

---

## Post de Reddit — cómo presentar los links

El post de Reddit es el momento de la verdad. Aquí hay que ser transparente sobre el canal de distribución y facilitar al máximo la instalación.

### Texto sugerido para la sección de links del post

```
**Links:**
- 🌐 **Web / PWA:** https://mypoop.app (también funciona en iOS desde Safari)
- 🤖 **Android APK:** https://github.com/tu-usuario/my-poop/releases/latest
- 🍎 **iOS:** abre la web en Safari — la app te guía para instalarla en tu Home Screen
- 💻 **Código fuente:** https://github.com/tu-usuario/my-poop (open source, MIT)
```

### Texto de credibilidad para el APK

Anticipar las preguntas del thread: "¿por qué no está en Play Store?" y "¿es seguro instalar este APK?":

```
**Android APK — preguntas frecuentes:**

*¿Por qué no está en Play Store?*
La Play Store requiere un proceso de verificación que tarda y tiene un one-time fee de $25.
Lo publicaremos cuando hayamos recibido suficiente feedback inicial. Por ahora el APK
directo permite actualizaciones instantáneas sin esperar review.

*¿Es seguro?*
El APK se compila automáticamente desde el código fuente en GitHub Actions (puedes
ver el workflow en .github/workflows/android-release.yml). Si no confías en el APK,
puedes compilarlo tú mismo con `npm run build:cap && npx cap sync && cd android && ./gradlew assembleDebug`.
La app es open source — nada que esconder.

*¿Por qué me pide instalar apps desconocidas?*
Android llama "desconocida" a cualquier app que no venga del Play Store. No significa
que sea maliciosa, solo que no pasó por el proceso de Google. Es el mismo mecanismo
que usa F-Droid, APKMirror, etc.
```

### Tips para el post

1. **Subir el APK a VirusTotal** antes del post y mencionar el link del scan. Elimina la paranoia.
2. **Añadir badge "open source"** en el README y en el post. La gente en Reddit/HN confía más en código abierto.
3. **GIF o video** del flujo: abrir app → ver mapa → tap en baño → dejar reseña. Vale más que mil palabras.
4. **Mencionar el número de baños** disponibles desde el primer día gracias al seed de OSM (e.g., "más de 50.000 baños en 15 ciudades"). Da credibilidad de que la app no está vacía.

---

## Consideraciones importantes

### Mantener dos codebases: PWA + nativo

Esto es lo más complicado a largo plazo. Hay que asegurarse de que cada feature nueva funcione en ambos contextos. El patrón a seguir:

```ts
// Patrón recomendado: siempre branch nativo primero, web como fallback
import { Capacitor } from '@capacitor/core'

if (Capacitor.isNativePlatform()) {
  // usar plugin nativo
} else {
  // usar browser API
}
```

**Lista de features que requieren branch dual:**
- Geolocalización (`@capacitor/geolocation` vs `navigator.geolocation`)
- Cámara (`@capacitor/camera` vs `<input type="file" capture>`)
- Share (`@capacitor/share` vs Web Share API)
- Deep links: la PWA usa URL normales, Capacitor puede interceptar `mypoop://` scheme
- Notificaciones push: `@capacitor/push-notifications` vs `Notification API` + service worker (tema aparte)

### ¿Cuándo publicar en Play Store? ($25 one-time)

Vale la pena cuando:
- Tienes más de 500-1000 usuarios activos mensuales y la fricción del APK side-load empieza a costar usuarios.
- Quieres auto-updates reales (Play Store gestiona las actualizaciones automáticamente).
- Quieres aparecer en búsquedas de "baños cerca" en Play Store.
- Alguien se queja de que no está en Play Store y eso bloquea la adopción.

No vale la pena si:
- Estás en early access con < 500 usuarios — el overhead de gestionar Play Store reviews no compensa.
- No has validado que los usuarios de Android prefieren la app nativa sobre la PWA.

**Proceso de publicación en Play Store** (cuando llegue el momento):
1. Crear cuenta de Google Play Developer ($25 one-time).
2. Build del Android App Bundle (`.aab`) en lugar de APK — Play Store prefiere este formato:
   ```bash
   cd android && ./gradlew bundleRelease
   # output: android/app/build/outputs/bundle/release/app-release.aab
   ```
3. Subir el `.aab` a Play Console, rellenar la ficha (screenshots, descripción, categoría).
4. Esperar el review inicial (~3 días).

### ¿Cuándo publicar en App Store? ($99/año)

Vale la pena cuando:
- Hay evidencia clara de que hay usuarios iOS que quieren la app nativa (encuesta en Reddit, analytics de PWA mostrando uso iOS alto).
- El proyecto tiene ingresos o está en proceso de monetización que justifique el coste anual.
- Quieres features como widgets de iOS, integración con Apple Maps, etc.

No vale la pena si:
- La PWA en Safari iOS ya cubre el 95% de los use cases.
- No hay budget para los $99/año.

### Permisos en Android y cómo afectan a la UX

El `AndroidManifest.xml` declara los permisos que la app puede pedir. Los permisos "dangerous" (los que el usuario tiene que aprobar explícitamente) son:

| Permiso | Cuándo se pide | Qué pasa si se deniega |
|---------|----------------|------------------------|
| `ACCESS_FINE_LOCATION` | Al pulsar "buscar cerca de mí" | Caer a búsqueda manual por ciudad |
| `ACCESS_COARSE_LOCATION` | Idem, como fallback | Idem |
| `CAMERA` | Al pulsar el botón de añadir foto | El botón de cámara no funciona |
| `READ_EXTERNAL_STORAGE` | Al seleccionar foto de galería | No se puede seleccionar de galería |

**Importante:** En Android 12+ no hace falta pedir `READ_EXTERNAL_STORAGE` para la galería si se usa `Camera.getPhoto()` con `CameraSource.Photos` y se targetea API 33+. Capacitor maneja esto correctamente.

### Deep links: capacitor los maneja, la PWA no fácilmente

Si en el futuro quieres que un link como `https://mypoop.app/bathroom/123` abra directamente la app en Android (en lugar del navegador), necesitas configurar Android App Links:

```json
// capacitor.config.ts
{
  "server": {
    "androidScheme": "https",
    "hostname": "mypoop.app"
  }
}
```

Y crear el archivo `.well-known/assetlinks.json` en el dominio. Esto hace que Android sepa que tu dominio está asociado con tu app. No es necesario para el MVP, pero es una mejora de UX notable.

---

## Orden de ataque sugerido

### Sprint 1 (hoy) — Primer APK de debug (~2-3h)

```bash
# 1. Instalar dependencias (~5 min)
npm install @capacitor/core @capacitor/android @capacitor/camera @capacitor/geolocation @capacitor/share @capacitor/app
npm install --save-dev @capacitor/cli

# 2. Crear capacitor.config.ts (5 min, copiar de esta guía)

# 3. Inicializar y añadir Android (~5 min)
npx cap init "My Poop" "com.mypoop.app" --web-dir .output/public
npx cap add android

# 4. Actualizar package.json con los scripts (2 min)

# 5. Actualizar nuxt.config.ts con ssr condicional (1 min)

# 6. Actualizar .gitignore (1 min)

# 7. Build y sync (~5 min)
npm run build:cap
npm run cap:sync

# 8. Abrir Android Studio y hacer assembleDebug (~10-15 min primera vez)
npm run cap:android
```

Al final del sprint: `app-debug.apk` listo para instalar en tu Android y probar.

### Sprint 2 (esta semana) — Composables nativos (~2h)

- Actualizar `useGeolocation.ts` con branch de `@capacitor/geolocation`.
- Actualizar `useShare.ts` con branch de `@capacitor/share`.
- Re-crear `usePhotoCapture.ts` con `@capacitor/camera`.
- Actualizar `PhotoUploader.vue` para usar captura nativa en Android.
- Probar el flujo completo: abrir app → ubicación → ver baño → dejar reseña con foto.

### Sprint 3 (antes del post de Reddit) — Firma y CI/CD (~2h)

- Generar keystore de producción y guardarla en seguro.
- Configurar signing en `android/app/build.gradle`.
- Subir secrets a GitHub.
- Crear `.github/workflows/android-release.yml`.
- Tagear `v1.0.0` y verificar que el workflow crea el GitHub Release con el APK adjunto.
- Subir el APK a VirusTotal.
- Probar el link de descarga desde el telefono.

### Sprint 4 (post Reddit day-1) — Monitorear y parchear

- Revisar issues de permisos en diferentes versiones de Android (el 90% de los bugs nativos son de permisos).
- Si la cámara nativa da problemas, el fallback de `<input capture>` ya existe en el branch web — es suficiente para v1.
- Si hay muchos usuarios iOS pidiéndolo: evaluar TestFlight / App Store.
- Verificar que el banner PWA de iOS aparece correctamente en Safari y no molesta en Android/desktop.

---

## Checklist final antes de publicar el APK

- [ ] `npm run build:cap` corre sin errores
- [ ] `npx cap sync android` corre sin errores
- [ ] APK se instala correctamente en un Android real (no solo emulador)
- [ ] Geolocalización funciona en Android (aparece el popup de permisos del SO)
- [ ] Cámara funciona al añadir foto en una reseña
- [ ] Share funciona y abre el share sheet de Android
- [ ] El mapa carga con los baños de la ciudad del usuario
- [ ] Login con Supabase funciona dentro del WebView
- [ ] El APK está firmado con la release keystore (no solo debug)
- [ ] El APK está subido a VirusTotal y el scan es limpio
- [ ] GitHub Release creado con el APK y las instrucciones de instalación
- [ ] `.gitignore` tiene `android/`, `ios/`, `*.jks`, `*.keystore`
- [ ] Los secrets de GitHub están configurados (para el workflow de CI/CD)
- [ ] Banner PWA aparece en Safari iOS (iPhone real o simulador)
- [ ] Banner NO aparece en Chrome Android ni en desktop
- [ ] Banner NO aparece si la PWA ya está instalada (modo standalone)
- [ ] Al descartar el banner, no vuelve a aparecer (localStorage)
