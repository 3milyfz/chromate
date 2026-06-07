/**
 * Chromate — Color Science Type System
 * ------------------------------------------------------------------
 * The vocabulary of the platform. Every structure here is grounded in
 * measurable color science (the Munsell triad of Hue, Value, Chroma,
 * expressed in screen-native HSL) yet carries the editorial language
 * that lets a season read as an essence rather than a swatch.
 *
 * These types are the single source of truth consumed by the seasonal
 * matrix (`src/data/seasons.ts`) and the global canvas state
 * (`src/context/AppContext.tsx`).
 */

/* ------------------------------------------------------------------ *
 * Primitive color coordinates
 * ------------------------------------------------------------------ */

/**
 * A single point in the HSL color space.
 *
 * - `h` — Hue, the angular position on the color wheel.        `0 – 360°`
 * - `s` — Saturation, the purity of the hue (Munsell "Chroma"). `0 – 100%`
 * - `l` — Lightness, the luminous value (Munsell "Value").      `0 – 100%`
 */
export interface HSL {
  /** Hue in degrees, `0 – 360`. */
  h: number;
  /** Saturation as a percentage, `0 – 100`. */
  s: number;
  /** Lightness as a percentage, `0 – 100`. */
  l: number;
}

/** An inclusive `[min, max]` numeric interval along a single axis. */
export interface Range {
  min: number;
  max: number;
}

/**
 * A volume in HSL space describing where a season "lives".
 *
 * A measured color is considered to belong to a season when each of its
 * three coordinates falls within the corresponding range. Hue is treated
 * as a linear interval here; seasons whose warmth wraps the red point
 * (e.g. `350°–20°`) should be modeled with caution at the integration layer.
 */
export interface HSLBoundaries {
  /** Permitted hue window in degrees, `0 – 360`. */
  hue: Range;
  /** Permitted saturation window in percent, `0 – 100`. */
  saturation: Range;
  /** Permitted lightness window in percent, `0 – 100`. */
  lightness: Range;
}

/* ------------------------------------------------------------------ *
 * Curated swatches
 * ------------------------------------------------------------------ */

/**
 * A named color — the atomic unit of a curated palette.
 *
 * `name` is intentionally editorial ("Smoked Olive", "Crushed Velvet"):
 * the language is part of the product, not decoration.
 */
export interface ColorSwatch {
  /** Hex string including the leading `#`, e.g. `#6B5B3E`. */
  hex: string;
  /** Luxurious, curated descriptor for the swatch. */
  name: string;
}

/* ------------------------------------------------------------------ *
 * Seasonal traits
 * ------------------------------------------------------------------ */

/**
 * The single defining dimension of a season within the four-axis model
 * of value (dark/light), chroma (bright/muted) and temperature (warm/cool).
 */
export type DominantTrait =
  | 'dark'
  | 'light'
  | 'bright'
  | 'muted'
  | 'warm'
  | 'cool';

/* ------------------------------------------------------------------ *
 * The season
 * ------------------------------------------------------------------ */

/**
 * A complete seasonal palette: the scientific boundaries that define it,
 * the curated colors that express it, and the poetic essence that frames it.
 */
export interface SeasonalPalette {
  /** Stable machine identifier, e.g. `dark_autumn`. */
  id: string;
  /** Human-facing title, e.g. `Dark Autumn`. */
  name: string;
  /**
   * A short, premium meditation on the season's full visual essence —
   * the interplay of contrast, hair, eyes, and overall presence.
   */
  auraDescription: string;
  /** The season's primary characteristic. */
  dominantTrait: DominantTrait;
  /** A supporting characteristic, phrased editorially. */
  secondaryTrait: string;
  /** The exact HSL volume the season occupies. */
  boundaries: HSLBoundaries;
  /** Six ultra-curated colors that sing in harmony with the season. */
  signatureColors: ColorSwatch[];
  /** Three colors that disrupt the season's harmony. */
  colorsToAvoid: ColorSwatch[];
}

/**
 * The canonical lookup of every season, keyed by `SeasonalPalette['id']`.
 * Implemented in `src/data/seasons.ts`.
 */
export type SeasonMatrix = Record<string, SeasonalPalette>;
