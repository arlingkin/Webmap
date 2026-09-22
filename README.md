# WebMap 🗺️

Dashboard data visualization **WebGL ringan** yang cepat, responsif, hemat cache — dibangun dengan **vanilla HTML/CSS/JS + Three.js** tanpa build tool.

## Fitur

- **Visualisasi 3D (Three.js)** — bar chart 3D interaktif (orbit + zoom), partikel latar hero. Rendering otomatis dijeda saat tab tersembunyi / keluar layar.
- **Grafik 2D ringan** — line, bar, dan donut dari canvas murni, tanpa library chart.
- **Dark / light mode** — toggle tersimpan di `localStorage`, mengikuti preferensi sistem.
- **Responsif** — menu hamburger mobile, grid adaptif, semantic HTML.
- **Animasi halus** — scroll reveal (IntersectionObserver), counter KPI, transisi CSS; hormati `prefers-reduced-motion`.
- **Form kontak** — validasi client-side + feedback, siap dihubungkan backend.
- **SEO & PWA dasar** — meta/Open Graph, `manifest.json`, service worker cache ringan.

## Struktur

```
webmap/
├── index.html        # semantik, SEO, importmap
├── css/style.css     # tema, layout, responsive
├── js/
│   ├── theme.js      # dark/light mode
│   ├── main.js       # nav, reveal, counter, form
│   ├── charts.js     # kanvas 2D: line/bar/donut
│   └── scene.js      # Three.js: hero + bar chart 3D
├── sw.js             # cache shell ringan
└── manifest.json     # PWA basic
```

## Menjalankan

```bash
python3 -m http.server 8000
# buka http://localhost:8000
```

Service worker & module `importmap` butuh server HTTP (bukan `file://`).

## Performa

- Total aset lokal < 20 KB.
- Three.js diambil dari CDN unpkg (strong HTTP cache).
- Draw calls minimal, `devicePixelRatio` dibatasi ≤ 2.
- `IntersectionObserver` + `visibilitychange` menangguhkan rendering.

## Lisensi

MIT