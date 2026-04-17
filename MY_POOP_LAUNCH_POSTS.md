# My Poop — Textos para Reddit y LinkedIn

---

## Reddit

### Subreddits recomendados (en orden de prioridad)

| Subreddit | Audiencia | Tipo de post | Notas |
|-----------|----------|--------------|-------|
| **r/SideProject** | ~200k, devs indie | Show-off | Tu audiencia #1. Valoran historia personal + tech stack |
| **r/webdev** | ~2M, devs web | Show-off / Discussion | Mencionar el stack (Nuxt, Supabase, Leaflet) |
| **r/vuejs** | ~100k, devs Vue | Show-off | Enfocado en el stack Vue/Nuxt |
| **r/InternetIsBeautiful** | ~17M, general | Link directo | Solo el link + descripción corta. Audiencia masiva pero exigente |
| **r/opensource** | ~50k, devs | Show-off | Enfatizar MIT license + GitHub |
| **r/digitalnomad** | ~2M, nómadas | Útil para ellos | Hook: "built this while traveling in Malaysia" |
| **r/travel** | ~8M, viajeros | Útil para ellos | Hook: "finding clean bathrooms abroad" |
| **r/solotravel** | ~3M, viajeros solo | Útil para ellos | Mismo hook que r/travel |
| **r/Android** | ~4M | App showcase | Link al APK de GitHub Releases |
| **r/spain** / **r/madrid** / **r/barcelona** | Local | Útil para ellos | Post en español, link a /city/madrid |

### Mejor hora para publicar

| Zona | Hora óptima | Por qué |
|------|-------------|---------|
| **USA East Coast** (tu audiencia principal en Reddit) | **Martes-Jueves 8-10 AM ET** | La gente abre Reddit al llegar al trabajo. Martes a jueves tienen más engagement que lunes (vuelta al curro) o viernes (ya están desconectados) |
| **En tu horario (GMT+8 Kuala Lumpur)** | **Martes-Jueves 8-10 PM** | = 8-10 AM Eastern |

**Estrategia de publicación:**
1. Publica primero en **r/SideProject** (más receptivo, buen feedback inicial)
2. Espera 1-2 días, ajusta el texto según los comentarios
3. Publica en **r/webdev** y **r/InternetIsBeautiful** (audiencia grande)
4. Espera otra semana para **r/travel** y **r/digitalnomad** (diferente ángulo)
5. Los subreddits locales (**r/spain**, **r/madrid**) cuando quieras, el timing importa menos

**Regla de Reddit:** NO publiques en todos el mismo día. Los mods y usuarios lo detectan como spam. Espacia 2-3 días mínimo entre posts.

---

### Post para r/SideProject y r/webdev

**Título:**
```
I built an app to find and review public bathrooms — because Google Maps won't tell you if there's toilet paper
```

**Cuerpo:**

```markdown
Hey everyone!

I'm Ernesto, a software engineer from Spain living in Kuala Lumpur. I built **My Poop** — a community-driven app to find, rate, and review public bathrooms.

**The problem:** You're traveling, you REALLY need to go, Google Maps shows a pin... but is it clean? Is it free? Does it even still exist? Three apps later, you're still clenching.

**The solution:** A bathroom map with real reviews. Cleanliness, privacy, toilet paper quality — the stuff that actually matters when you need to go.

**What it does:**
- 25,700+ bathrooms across 84 cities (seeded from OpenStreetMap)
- Rate bathrooms on cleanliness, privacy, and toilet paper quality (1-5 🧻 rolls)
- SOS button — find the nearest bathroom in one tap
- Community-verified: edit and improve imported data
- City pages with stats (e.g. /city/tokyo — 1,500+ bathrooms)
- Real-time status reports (no paper, dirty, closed)
- Photo uploads with NSFW detection
- PWA + Android APK — no app store needed

**Tech stack:**
- Vue 3 + Nuxt 4 + TypeScript
- Supabase (PostgreSQL, Auth, Storage, RLS)
- Leaflet + OpenStreetMap
- Vercel (Edge, Analytics)
- Capacitor (Android)
- NSFW.js for content moderation

**Try it:**
- 🌐 Web: https://my-poop.vercel.app
- 🤖 Android APK: https://github.com/evivar/my-poop/releases/latest
- 🍎 iOS: open the web in Safari → Share → Add to Home Screen
- 💻 Source: https://github.com/evivar/my-poop (MIT license)

Built as a solo side project. Fully open source. No ads, no tracking, no BS.

Would love your feedback — what features would you add? What cities should I seed next?

[GIF/screenshots here]
```

---

### Post para r/InternetIsBeautiful

**Título:**
```
My Poop — A free app to find and review public bathrooms with real ratings on cleanliness, privacy, and toilet paper quality
```

**Cuerpo:**

```markdown
https://my-poop.vercel.app

25,700+ bathrooms across 84 cities worldwide. Rate and review on cleanliness, privacy, and toilet paper quality (yes, with toilet paper roll emojis 🧻). 

Community-driven, open source, no ads, no tracking. Also available as an Android app.
```

*(r/InternetIsBeautiful prefiere posts cortos y directos. El link es lo que importa.)*

---

### Post para r/travel / r/digitalnomad / r/solotravel

**Título:**
```
I built a free app to find clean public bathrooms while traveling — 25,700+ bathrooms in 84 cities
```

**Cuerpo:**

```markdown
After years of traveling around Southeast Asia and Europe, I got tired of the bathroom lottery. Google Maps tells you there's a bathroom nearby, but it doesn't tell you if it's clean, if it has paper, or if you'll need to pay.

So I built **My Poop** — a community-driven bathroom map with real reviews:

- **25,700+ bathrooms** across 84 cities (Madrid, Tokyo, Bangkok, NYC, London, Paris...)
- Rate on **cleanliness, privacy, and toilet paper quality**
- **SOS button** to find the nearest one instantly
- **Free, no ads, no tracking**
- Works on any phone (web app + Android APK)

Cities with the most bathrooms: Tokyo (1,550), Paris (1,070), Berlin (890), Nairobi (2,200!), Singapore (818).

Try it: https://my-poop.vercel.app

It's free and open source. If your city isn't covered well, let me know — I can add it to the next data import.

What cities would be most useful for you?
```

---

### Post para r/spain / r/madrid (en español)

**Título:**
```
He creado una app gratuita para encontrar y valorar baños públicos — Madrid ya tiene 367 baños mapeados
```

**Cuerpo:**

```markdown
Hola! Soy Ernesto, desarrollador español viviendo en Kuala Lumpur. He creado **My Poop**, una app para encontrar, valorar y reseñar baños públicos.

**El problema:** abres Google Maps, ves que hay un baño... pero ¿está limpio? ¿es gratis? ¿sigue existiendo?

**La solución:** un mapa de baños con reseñas reales. Limpieza, privacidad, calidad del papel — lo que importa de verdad.

Madrid ya tiene **367 baños** mapeados con datos de OpenStreetMap. También Barcelona (349), Valencia (86), Sevilla (65), Bilbao (100), Málaga (78) y más.

**Pruébala:**
- 🌐 Web: https://my-poop.vercel.app/city/madrid
- 🤖 Android: https://github.com/evivar/my-poop/releases/latest
- 🍎 iPhone: abre la web en Safari → Compartir → Añadir a pantalla de inicio

Gratis, sin anuncios, sin tracking, código abierto.

¿Echáis en falta algún baño? Podéis añadirlo directamente desde la app o editar los que ya hay para mejorar la info.
```

---

## LinkedIn

### Post (para tu perfil personal)

```
I built a side project and shipped it to production in a few weeks.

It's called My Poop — a community-driven app to find and review public bathrooms. Yes, seriously. 🧻

The idea came from a real problem: traveling in Southeast Asia, needing a bathroom urgently, and realizing that Google Maps will show you WHERE one is — but not if it's clean, if it has toilet paper, or if you'll need to pay.

So I built the app I wish existed.

Some numbers:
📍 25,700+ bathrooms across 84 cities in 40+ countries
🗺️ Data seeded from OpenStreetMap via Overpass API
⭐ Reviews with ratings on cleanliness, privacy, and toilet paper quality
📱 Available as PWA, Android APK, and web app

The tech stack:
→ Vue 3 + Nuxt 4 + TypeScript (frontend)
→ Supabase with PostgreSQL + Row Level Security (backend)
→ Leaflet + OpenStreetMap (mapping)
→ Vercel Edge (hosting + analytics)
→ Capacitor (Android native)
→ GitHub Actions (CI/CD for automated APK builds)

Some technical challenges I enjoyed solving:
• Bbox-based data fetching with pagination to handle 25k+ markers without hitting PostgREST's 1000-row limit
• RESTRICTIVE RLS policies for rate limiting (3 bathrooms/hour, 5 reviews/hour) — pure SQL, zero backend code
• Server-side IP country detection via Vercel edge headers for smarter map defaults
• A SQL trigger that prevents tampering with locked fields on community-edited OpenStreetMap bathrooms while auto-marking them as "verified"

It's fully open source (MIT): https://github.com/evivar/my-poop
Try it: https://my-poop.vercel.app

If you're a recruiter reading this: yes, this is what I do for fun. Imagine what I do for work. 😄

#sideproject #opensource #vuejs #nuxt #supabase #webdev #typescript #buildinpublic

[Attach: screenshots + GIF]
```

---

## Notas finales

### Formato de imágenes por plataforma

| Plataforma | Formato | Recomendación |
|------------|---------|---------------|
| Reddit | Link a imgur o Reddit gallery | Sube las imágenes a Reddit directamente al crear el post (image post) o pon links a imgur |
| LinkedIn | Imágenes nativas o carrusel | Adjunta las imágenes al post. LinkedIn prioriza posts con imágenes nativas (no links externos). El carrusel (PDF con slides) tiene mucho más alcance que imágenes sueltas |

### Para LinkedIn — carrusel (máximo alcance)

Si quieres el máximo alcance en LinkedIn, convierte los screenshots en un **PDF carrusel** (cada página = 1 imagen). LinkedIn da 3-5x más impresiones a carruseles que a posts normales.

Páginas sugeridas:
1. **Portada**: "My Poop — Find & Review Public Bathrooms" + logo
2. **El problema**: "Google Maps won't tell you if there's toilet paper"
3. **Screenshot del mapa**: mostrando Madrid con baños
4. **Screenshot del detalle**: rating con rollitos
5. **Los números**: 25,700+ bathrooms, 84 cities, 40+ countries
6. **Tech stack**: badges visuales
7. **CTA**: "Try it → my-poop.vercel.app | Open source → github.com/evivar/my-poop"
