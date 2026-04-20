<template>
  <div class="max-w-2xl mx-auto p-6">
    <div class="flex items-center gap-3 mb-8">
      <UButton icon="i-heroicons-arrow-left" variant="ghost" size="lg" to="/" />
      <h1 class="text-2xl font-bold">{{ $t('nav.privacy') }}</h1>
    </div>

    <div v-if="locale === 'es'" class="prose prose-invert max-w-none space-y-4 text-sm">
      <p class="text-gray-400">Última actualización: abril 2026</p>

      <h2 class="text-lg font-semibold">Qué datos guardamos</h2>
      <ul>
        <li><strong>Si te registras con email:</strong> tu dirección de email y un nombre de usuario que eliges tú.</li>
        <li><strong>Si te registras con Google:</strong> tu email y nombre de tu cuenta de Google. No accedemos a tu contraseña de Google ni a ningún otro dato.</li>
        <li><strong>Cuando usas la app:</strong> las reseñas que escribes, las fotos que subes y los baños que añades o editas. Todo es voluntario.</li>
        <li><strong>Geolocalización:</strong> se solicita para centrar el mapa en tu zona. Se procesa en tu navegador y <strong>no se guarda en nuestros servidores</strong>.</li>
      </ul>

      <h2 class="text-lg font-semibold">Qué NO hacemos</h2>
      <ul>
        <li>No mostramos anuncios.</li>
        <li>No vendemos ni compartimos tus datos con terceros.</li>
        <li>No usamos cookies de tracking. Vercel Analytics recopila métricas agregadas anónimas (páginas vistas, país, dispositivo) sin cookies ni datos personales.</li>
      </ul>

      <h2 class="text-lg font-semibold">Dónde se alojan tus datos</h2>
      <ul>
        <li><strong>Base de datos y autenticación:</strong> <a href="https://supabase.com" target="_blank" class="text-primary hover:underline">Supabase</a> (infraestructura en AWS).</li>
        <li><strong>Hosting web:</strong> <a href="https://vercel.com" target="_blank" class="text-primary hover:underline">Vercel</a>.</li>
        <li><strong>Fotos:</strong> Supabase Storage.</li>
      </ul>

      <h2 class="text-lg font-semibold">Cómo borrar tus datos</h2>
      <p>
        Puedes eliminar tus reseñas y fotos desde tu perfil dentro de la app.
        Si quieres borrar tu cuenta por completo, abre un issue en
        <a href="https://github.com/evivar/my-poop" target="_blank" class="text-primary hover:underline">GitHub</a>
        y lo procesamos en un máximo de 7 días.
      </p>

      <h2 class="text-lg font-semibold">Datos de OpenStreetMap</h2>
      <p>
        Los baños importados de OpenStreetMap se muestran bajo la licencia
        <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" class="text-primary hover:underline">ODbL</a>.
        Los datos originales pertenecen a los contribuidores de OpenStreetMap.
      </p>
    </div>

    <div v-else class="prose prose-invert max-w-none space-y-4 text-sm">
      <p class="text-gray-400">Last updated: April 2026</p>

      <h2 class="text-lg font-semibold">What data we store</h2>
      <ul>
        <li><strong>If you sign up with email:</strong> your email address and a display name you choose.</li>
        <li><strong>If you sign up with Google:</strong> your email and name from your Google account. We never access your Google password or any other data.</li>
        <li><strong>When you use the app:</strong> the reviews you write, photos you upload, and bathrooms you add or edit. Everything is voluntary.</li>
        <li><strong>Geolocation:</strong> requested to center the map on your area. It's processed in your browser and <strong>never stored on our servers</strong>.</li>
      </ul>

      <h2 class="text-lg font-semibold">What we DON'T do</h2>
      <ul>
        <li>We don't show ads.</li>
        <li>We don't sell or share your data with third parties.</li>
        <li>We don't use tracking cookies. Vercel Analytics collects anonymous aggregate metrics (page views, country, device) without cookies or personal data.</li>
      </ul>

      <h2 class="text-lg font-semibold">Where your data is hosted</h2>
      <ul>
        <li><strong>Database & auth:</strong> <a href="https://supabase.com" target="_blank" class="text-primary hover:underline">Supabase</a> (infrastructure on AWS).</li>
        <li><strong>Web hosting:</strong> <a href="https://vercel.com" target="_blank" class="text-primary hover:underline">Vercel</a>.</li>
        <li><strong>Photos:</strong> Supabase Storage.</li>
      </ul>

      <h2 class="text-lg font-semibold">How to delete your data</h2>
      <p>
        You can delete your reviews and photos from your profile within the app.
        If you want to delete your entire account, open an issue on
        <a href="https://github.com/evivar/my-poop" target="_blank" class="text-primary hover:underline">GitHub</a>
        and we'll process it within 7 days.
      </p>

      <h2 class="text-lg font-semibold">OpenStreetMap data</h2>
      <p>
        Bathrooms imported from OpenStreetMap are displayed under the
        <a href="https://opendatacommons.org/licenses/odbl/" target="_blank" class="text-primary hover:underline">ODbL</a> license.
        The original data belongs to OpenStreetMap contributors.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n()

useSeoMeta({
  title: () => locale.value === 'es'
    ? 'Política de Privacidad — My Poop'
    : 'Privacy Policy — My Poop',
  description: () => locale.value === 'es'
    ? 'Política de privacidad de My Poop. Sin anuncios, sin tracking, sin venta de datos. Tus datos, tu control.'
    : 'Privacy policy for My Poop. No ads, no tracking, no data selling. Your data, your control.',
})
</script>
