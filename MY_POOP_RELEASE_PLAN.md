# My Poop — Plan de lanzamiento

Estrategia de lanzamiento en Reddit para conseguir tráfico real, organizada por palanca.
Acompaña al `MY_POOP_PLAN_V4.md` técnico — este documento es **marketing y go-to-market**, no código.

---

## Pre-requisitos antes de postear NADA

Estos NO son nice-to-have. Si no están listos, el primer comentario va a matar el post:

1. **Seed denso de OSM en zonas objetivo** — sin esto el mapa está vacío y los usuarios bouncean en 5 segundos.
   - Madrid + Barcelona + Valencia (España)
   - Kuala Lumpur (Malasia)
   - Top 5-10 ciudades de USA/UK/Europa para los posts globales
2. **PWA funcional** — "Add to Home Screen" en iOS/Android sin warnings. Distribuir APK por Reddit es voto negativo garantizado.
3. **Rate limiting RLS en Supabase** — para sobrevivir a los trolls que Reddit garantiza traer.
4. **Vercel Analytics activo** — sin medición no hay aprendizaje entre posts.

---

## Tier 1 — Alcance global, alta probabilidad

### r/SideProject (~250k)
- Sub más amistoso con side projects. Audiencia global y técnica.
- Self-promo permitido, esperan ver stack y la historia.
- **Título sugerido:** *"I built My Poop — a Yelp for public bathrooms with real ratings (Nuxt + Supabase, free)"*
- Acepta links a la web directamente.

### r/InternetIsBeautiful (~17M) — apuesta máxima
- Reglas estrictas: nada de login obligatorio para uso básico, debe funcionar en escritorio, sin promo descarada.
- Si pasa el filtro: 50k+ visitas en un día. Si no pasa: borrado sin avisar.
- **Verificar antes:** que el home cargue el mapa sin pedir login.
- **Postear el último**, cuando todo lo demás esté pulido.

### r/travel (~10M) — el dark horse
- Encontrar baños es un dolor real de viajeros, no comodidad.
- **Framing crítico:** NO "mira mi app". Sí storytelling personal: *"After getting caught in Bangkok needing a bathroom, I made a free map of public toilets"*.
- Reglas estrictas con self-promo, leer wiki primero.

### r/digitalnomad (~2.5M)
- Audiencia exacta: gente cambiando de ciudad cada semana.
- Encaja con tu situación real (vives en KL).
- **Framing:** *"As a nomad living in KL, I built a free bathroom finder"*.

---

## Tier 2 — Nicho con altísima conversión

### r/CrohnsDisease (~50k), r/UlcerativeColitis (~30k), r/ibs (~120k)
- Para esta gente encontrar baño rápido es **urgencia médica**, no comodidad.
- El botón SOS de "baño más cercano" está literalmente hecho para ellos.
- **Reglas de oro:**
  - NO pitch. Pedir feedback genuino.
  - Frase tipo: *"I built a free bathroom finder app and I'd like feedback from people who actually need it — no signup to browse, your tips would shape it"*
  - Acercamiento humilde, no promocional.
- Es la audiencia con mayor conversión a usuarios recurrentes y evangelistas.
- Si solo se pudiera postear en un sitio fuera de España/Malasia, sería aquí.

### r/solotravel (~3M)
- Similar a r/travel, más receptivo a apps útiles.

---

## Tier 3 — España (no negociable)

### r/spain (~750k)
- Post en inglés o español, ambos funcionan.
- **Framing personal:** *"Soy de Madrid, llevo meses haciendo una app para encontrar baños públicos en España, ya he sembrado [N] baños en Madrid/BCN/Valencia. Buscando feedback"*
- Self-promo permitido en posts ocasionales si aporta valor. NO postear varias veces.

### r/madrid (~90k) — terreno más amistoso
- Sub bilingüe, más pequeño, más amistoso.
- **Framing como invitación a colaborar:** *"He hecho una app de baños públicos en Madrid — si conoces alguno que falte, ayúdame a añadirlo"*
- Convierte el post en colaboración, no anuncio. Comentarios "falta el baño de X" = engagement gratis.
- **Imprescindible:** Madrid densamente sembrada antes de postear.

### r/askspain (~60k)
- Funciona como pregunta: *"¿Conocéis alguna app para encontrar baños públicos en España? He hecho una y..."*

---

## Tier 4 — Malasia (ventaja única)

### r/malaysia (~900k)
- Sub grande, mayoritariamente en inglés, tech-friendly.
- **Ángulo único:** extranjero viviendo en KL que ha hecho una app útil para Malasia.
- **Framing:** *"Spanish dev living in KL — I built a free public bathroom finder, started seeding KL"*
- Menos competencia de side projects internacionales que en otros subs grandes.

### r/KualaLumpur (~30k)
- Más pequeño y local, mismo framing.

### r/Bolehland (~70k)
- Sub más informal/meme-y. Bueno si encuentras el ángulo humorístico (My Poop tiene mucho potencial).
- Leer el tono del sub primero.

---

## Reglas tácticas (más importantes que la lista de subs)

1. **NO postear todo el mismo día.** Reddit detecta cross-posting agresivo y los mods también. Mínimo 2-3 días entre posts. Una semana es razonable.

2. **Título distinto en cada sub.** Reddit indexa títulos. Repetir marca la cuenta como spammer.

3. **Cuidado con cuentas nuevas/sin karma.** Muchos subs (r/travel, r/spain, r/europe) filtran automáticamente cuentas con < 100 karma o < 30 días. Si la cuenta es nueva, comentar en otras posts unos días antes.

4. **La primera hora decide todo.** Los upvotes en los primeros 30-60 min deciden si el post explota o muere. Postear cuando la zona objetivo está despierta:
   - r/SideProject, r/digitalnomad: 9-11h ET (USA despertando)
   - r/spain, r/madrid: 19-21h hora España (después del trabajo)
   - r/malaysia: 19-21h hora KL
   - r/travel global: 14-16h GMT

5. **Responder TODOS los comentarios las primeras 4 horas.** Reddit recompensa OPs activos en el ranking. Los redditors notan presencia vs. drive-by spam.

6. **Leer las reglas de cada sub antes de postear.** Cada sub tiene su Wiki. Violar reglas → post borrado + cuenta marcada por mods.

7. **El comentario más votado define la conversación.** Si la primera respuesta dice "está vacía en mi ciudad" o "necesita login para todo", el post está muerto. Por eso seed OSM y PWA son **requisitos**, no nice-to-haves.

---

## Orden de lanzamiento recomendado

Asumiendo pre-requisitos completados:

| Día | Sub | Propósito |
|-----|-----|-----------|
| 1 | r/SideProject | Terreno blando, prueba de copy, primer feedback |
| 3 | r/madrid | Pequeño, local, casa, fácil |
| 5 | r/digitalnomad | Encaja con historia personal de KL |
| 7 | r/spain | Más grande, ya con feedback de anteriores |
| 10 | r/malaysia | Ángulo único de extranjero en KL |
| 14 | r/travel | Apuesta grande, solo tras pulir todo |
| 16-20 | r/CrohnsDisease, r/ibs | Con humildad, pidiendo feedback genuino |
| Final | r/InternetIsBeautiful | Apuesta máxima, cuando todo funcione perfecto |

**Por qué escalonado:** 2-3 semanas de lanzamiento en lugar de un disparo único. Cada post enseña qué arreglar antes del siguiente. Si el día 1 alguien dice "el icono se ve mal en iOS", se arregla antes del día 3.

---

## Métricas a vigilar tras cada post

- **Visitas únicas** (Vercel Analytics)
- **Bounce rate** — si > 70% el problema está en el primer impacto (mapa vacío, login, lentitud)
- **Bathrooms creados por usuarios** — la métrica de éxito real
- **Reviews creadas** — segunda métrica de éxito
- **Reportes de abuso** — si suben de golpe, ajustar rate limiting
- **Feedback en comentarios** — convertir en issues/tareas, citar al usuario en el changelog ("gracias a u/X arreglamos Y")
