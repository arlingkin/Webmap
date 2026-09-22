# WebMap 🗺️

Dashboard data visualization **WebGL ringan** yang cepat, responsif, hemat cache — dibangun dengan **vanilla HTML/CSS/JS + Three.js + Leaflet**, didukung **micro-server Node.js tanpa dependency**.

## Fitur

- **Visualisasi 3D (Three.js)** — bar chart 3D interaktif (orbit + zoom), partikel latar hero. Rendering otomatis dijeda saat tab tersembunyi / keluar layar.
- **Grafik 2D ringan** — line, bar, dan donut dari canvas murni, tanpa library chart. Grafik garis **live real-time** via SSE (`/api/stream`), dengan simulasi lokal sebagai cadangan.
- **Peta Lokasi (Leaflet)** — titik aktivitas dari API Node (`/api/locations`), peta otomatis ikut ganti tema; fallback ke data statis jika server Node tidak aktif.
- **Micro-server Node.js** (`server.js`, zero-dependency) — serve statis + gzip + ETag/cache header, endpoint `/api/health`, `/api/locations`, `/api/kpi`, dan `/api/stream` (SSE).
- **KPI live dari API** — nilai angka di Ringkasan diperbarui dari `/api/kpi` bila tersedia.
- **Dark / light mode** — toggle tersimpan di `localStorage`, mengikuti preferensi sistem.
- **Responsif** — menu hamburger mobile, grid adaptif, semantic HTML.
- **Animasi halus** — scroll reveal (IntersectionObserver), counter KPI, transisi CSS; hormati `prefers-reduced-motion`.
- **Form kontak** — validasi client-side + feedback, siap dihubungkan backend.
- **SEO & PWA dasar** — meta/Open Graph, `manifest.json`, service worker cache ringan (termasuk precache Leaflet).

## Struktur

```
webmap/
├── index.html        # semantik, SEO, importmap, peta + badge live
├── server.js         # micro-server Node (statis+gzip, API, SSE)
├── package.json      # scripts: start & check
├── css/style.css     # tema, layout, responsive, map
├── js/
│   ├── theme.js      # dark/light mode
│   ├── main.js       # nav, reveal, counter, form, refresh KPI
│   ├── charts.js     # kanvas 2D: line/bar/donut + live buffer
│   ├── map.js        # Leaflet: peta lokasi + fallback data
│   ├── live.js       # SSE consumer + fallback simulasi
│   └── scene.js      # Three.js: hero + bar chart 3D
├── sw.js             # cache shell ringan (+ precache Leaflet)
└── manifest.json     # PWA basic
```

## Menjalankan

**Dengan micro-server Node (disarankan):**

```bash
npm start          # atau: PORT=8080 node server.js
# buka http://localhost:8000
```

Server menyediakan juga:
- `GET /api/health` — status, uptime, jumlah klien SSE
- `GET /api/locations` — data titik untuk peta
- `GET /api/kpi` — angka KPI (dipakai halaman untuk refresh)
- `GET /api/stream` — Server-Sent Events, satu nilai setiap 2 detik

**Tanpa Node (halaman tetap jalan):**

```bash
python3 -m http.server 8000
```

Halaman otomatis fallback ke data statis; badge grafik berubah ke mode "simulasi", peta memakai sumber "data statis".

## Performa

- Total aset lokal < 20 KB.
- Three.js & Leaflet diambil dari CDN unpkg (strong HTTP cache; Leaflet diprecache oleh SW).
- Draw calls minimal, `devicePixelRatio` dibatasi ≤ 2.
- `IntersectionObserver` + `visibilitychange` menangguhkan rendering.
- Server: gzip, ETag, `no-store` untuk API, SPA-cache ringan.

## Lisensi

MIT