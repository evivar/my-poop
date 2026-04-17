<p align="center">
  <img src="public/favicon-96x96.png" alt="My Poop" width="80" />
</p>

<h1 align="center">My Poop</h1>

<p align="center">
  <strong>Find & review public bathrooms. Wherever you are.</strong>
</p>

<p align="center">
  <a href="https://my-poop.vercel.app">Web App</a> &nbsp;·&nbsp;
  <a href="https://github.com/evivar/my-poop/releases/latest">Android APK</a> &nbsp;·&nbsp;
  <a href="https://my-poop.vercel.app/about">About</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License" />
  <img src="https://img.shields.io/badge/bathrooms-25%2C700%2B-blue" alt="25,700+ bathrooms" />
  <img src="https://img.shields.io/badge/cities-84-orange" alt="84 cities" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome" />
</p>

---

## The problem

You're traveling, you REALLY need to go, and Google Maps shows a pin — but is it clean? Is it free? Does it even still exist?

**My Poop** is a community-driven public bathroom map with real reviews from real people. Cleanliness, privacy, toilet paper quality — the stuff that actually matters.

<p align="center">
  <img src="docs/screenshots/sos-demo.gif" alt="SOS button demo" width="300" />
  <br />
  <em>Find the nearest bathroom in one tap</em>
</p>

## Screenshots

<p align="center">
  <img src="docs/screenshots/map.png" alt="Map view" width="200" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/detail.png" alt="Bathroom detail" width="200" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/review.png" alt="Leave a review" width="200" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/city.png" alt="City page" width="200" />
</p>

## Features

- **25,700+ bathrooms** seeded from OpenStreetMap across 84 cities in 40+ countries
- **Real reviews** — rate cleanliness, privacy, and toilet paper quality on a 1-5 roll scale
- **Interactive map** with clustering, search, and filters (type, free, accessible, rating)
- **SOS button** — find the nearest bathroom instantly
- **City pages** — landing pages for every city with stats and top rated bathrooms
- **Edit OSM bathrooms** — help improve imported data (name, hours, accessibility)
- **Photos** — upload and browse community photos with NSFW detection
- **Real-time status** — report "no paper", "dirty", "closed" so others know what to expect
- **Get Directions** — one tap to Google Maps / Apple Maps with walking directions
- **Share** — send any bathroom to friends via native share or clipboard
- **Favorites** — save bathrooms you visit frequently
- **PWA** — install from browser on any device, works offline
- **Android app** — native APK with GPS and camera integration
- **iOS** — install as PWA from Safari (Add to Home Screen)
- **Multi-language** — English and Spanish
- **Dark mode** — easy on the eyes during those late-night emergencies

## Try it

| Platform | How |
|----------|-----|
| **Web** | [my-poop.vercel.app](https://my-poop.vercel.app) |
| **Android** | Download APK from [Releases](https://github.com/evivar/my-poop/releases/latest) |
| **iOS** | Open the web app in Safari, tap Share, then "Add to Home Screen" |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3, Nuxt 4, TypeScript |
| UI | Nuxt UI v4, Tailwind CSS |
| Map | Leaflet + MarkerCluster |
| Backend | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Data | OpenStreetMap (Overpass API) |
| Hosting | Vercel (Edge, Analytics) |
| Mobile | Capacitor (Android), PWA (iOS) |
| Content safety | NSFW.js (TensorFlow) |

## Getting started

### Prerequisites

- Node.js >= 22
- npm
- A [Supabase](https://supabase.com) project

### Setup

```bash
# Clone
git clone https://github.com/evivar/my-poop.git
cd my-poop

# Install
npm install

# Configure environment
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_KEY

# Run dev server
npm run dev
```

### Seed bathrooms from OpenStreetMap

```bash
# All 84 cities
npm run seed:osm

# Single city
npm run seed:osm madrid
```

## Contributing

Contributions are welcome! Whether it's a bug fix, a new feature, or a bathroom in a city we don't cover yet.

1. Fork the repo
2. Create your branch (`git checkout -b feat/my-feature`)
3. Commit your changes
4. Push and open a PR

## License

[MIT](LICENSE)

## Author

**Ernesto Vivar** — Software engineer from Spain, based in Kuala Lumpur.

Built because finding a decent bathroom while traveling shouldn't require 3 apps and a prayer.
