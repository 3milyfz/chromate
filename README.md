<p align="center">
  <img src="./assets/logo.svg" alt="Chromate" width="360" />
</p>

<p align="center">
  <em>Your colors, decoded.</em>
</p>

<p align="center">
  <sub>Seasonal Color Studio · Grounded in the Munsell Color System</sub>
</p>

<br />

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/License-MIT-A88A5E?style=flat-square" alt="MIT License" />
</p>

<br />

---

## Manifesto

**Chromate** is an avant-garde seasonal color analysis studio. It treats your personal palette as a compiled dossier, a leather-bound archive of the tones that belong to you and the ones that don't.

---

## Features

### Your Palette
A visual canvas archive for each confirmed season, aura description, dominant traits, and a debossed signature swatch plate of six curated tones. Switch between your seasons from a left-page index.

### Scanner File
Drop an image of any color or garment onto a vellum zone. Chromate extracts the dominant color via canvas-based clustering, then runs it through a three-axis seasonal filter:

| Axis | Measures | Question |
| :--- | :--- | :--- |
| **Temperature** | Hue | Warm or cool? |
| **Value** | Lightness | Deep or light? |
| **Chroma** | Saturation | Muted or vivid? |

Each scan returns a classified season, and a trait-aware verdict. Scanned items compile into your virtual closet.

---

## The 12-Season Matrix

Chromate models seasonal color theory as discrete volumes in HSL space, governed by three scientific axes:

```
Value       : Lightness   (dark ⟷ light)
Chroma      : Saturation  (bright ⟷ muted)
Temperature : Hue         (warm ⟷ cool)
```

Four anchor seasons (**Dark Autumn**, **Dark Winter**, **Bright Spring**, **Soft Summer**) define the boundaries. The remaining eight are mathematically interpolated so every season occupies a distinct, non-degenerate region while flowing naturally around the seasonal wheel.

| Autumn | Spring | Summer | Winter |
| :--- | :--- | :--- | :--- |
| Dark Autumn | Bright Spring | Soft Summer | Dark Winter |
| True Autumn | True Spring | True Summer | True Winter |
| Warm Autumn | Light Spring | Light Summer | Bright Winter |

---

## Tech Stack

| Layer | Choice |
| :--- | :--- |
| **Framework** | React 18 + TypeScript |
| **Build** | Vite 5 |
| **Styling** | Tailwind CSS with a custom archival design system |
| **Typography** | Cormorant Garamond (serif) · Inter (sans) |
| **Testing** | Vitest, color extraction & palette matching |
| **Persistence** | `localStorage`, session, seasons, closet |

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`). Unveil the envelope, select your season(s), and open your dossier.

### Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |

---

## Project Structure

```
src/
├── components/
│   ├── EnvelopeLanding.tsx    # State 1, auth gate
│   ├── SeasonOnboarding.tsx   # State 2, season selection
│   ├── Dossier.tsx            # State 3, two-page spread
│   ├── SeasonBackdrop.tsx     # Seasonal mood imagery
│   ├── SwatchPlate.tsx        # Debossed color swatches
│   └── pages/                 # Dossier tab content
├── context/
│   └── AppContext.tsx         # Global state + localStorage
├── data/
│   ├── seasons.ts             # 12-season HSL matrix
│   └── seasonAesthetics.ts    # Backdrop image map
├── types/
│   └── color.ts               # HSL, palette, and range types
└── utils/
    ├── colorExtractor.ts      # Dominant-color extraction engine
    └── paletteMatcher.ts      # Three-axis seasonal filter
```

---

## License

[MIT](./LICENSE) · Copyright (c) 2026 Emily

---

<p align="center">
  <sub>Chromate · Seasonal Color Studio</sub>
</p>
