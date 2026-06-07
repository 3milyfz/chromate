/**
 * Chromate: The 12-Season Color Matrix
 * ------------------------------------------------------------------
 * A scientific atlas. Each season is a discrete volume in HSL space,
 * derived from the four governing axes of seasonal color theory:
 *
 *   • Value       : Lightness   (dark ⟷ light)
 *   • Chroma      : Saturation  (bright ⟷ muted/soft)
 *   • Temperature : Hue         (warm ⟷ cool)
 *
 * The four anchor seasons (Dark Autumn, Dark Winter, Bright Spring,
 * Soft Summer) use the boundaries specified by the science team. The
 * remaining eight are mathematically interpolated so that every season
 * occupies a distinct, non-degenerate region while flowing naturally
 * into its neighbours around the seasonal wheel.
 *
 * Signature palettes intentionally span the hue wheel, a season is a
 * shared temperature, value and chroma, not a single hue, so the swatch
 * hexes are not constrained to the detection `boundaries` above.
 */

import type { SeasonalPalette, SeasonMatrix } from '@/types/color';

/* ================================================================== *
 * AUTUMN, warm, grounded, the chroma of pressed pigment and patina.
 * ================================================================== */

/** Deep, smoldering, low-key warmth. The science-team anchor for Autumn. */
const DARK_AUTUMN: SeasonalPalette = {
  id: 'dark_autumn',
  name: 'Dark Autumn',
  auraDescription:
    'Deep, warm coloring, dark hair and eyes against skin with golden warmth. Rich and low-contrast.',
  dominantTrait: 'dark',
  secondaryTrait: 'Warm undertone with high tonal depth',
  boundaries: {
    hue: { min: 15, max: 65 },
    saturation: { min: 20, max: 65 },
    lightness: { min: 15, max: 45 },
  },
  signatureColors: [
    { hex: '#6B4A2B', name: 'Burnished Chestnut' },
    { hex: '#5C4326', name: 'Tobacco Leaf' },
    { hex: '#6E2E22', name: 'Crushed Garnet' },
    { hex: '#8A6A3A', name: 'Muted Ochre' },
    { hex: '#4E4B2E', name: 'Smoked Olive' },
    { hex: '#2F5E52', name: 'Deep Verdigris' },
  ],
  colorsToAvoid: [
    { hex: '#BFE9DE', name: 'Glacial Mint' },
    { hex: '#D9C7E8', name: 'Powder Lilac' },
    { hex: '#FBFBF7', name: 'Optic White' },
  ],
};

/** The purest expression of warmth, rich, saturated, fully autumnal. */
const TRUE_AUTUMN: SeasonalPalette = {
  id: 'true_autumn',
  name: 'True Autumn',
  auraDescription:
    'The warmest, richest season. Auburn hair, green or topaz eyes, and skin with a golden glow. Earthy and saturated.',
  dominantTrait: 'warm',
  secondaryTrait: 'Rich, medium-depth saturation',
  boundaries: {
    hue: { min: 20, max: 55 },
    saturation: { min: 35, max: 70 },
    lightness: { min: 30, max: 55 },
  },
  signatureColors: [
    { hex: '#A8522C', name: 'Terracotta Ember' },
    { hex: '#7E7A2E', name: 'Golden Moss' },
    { hex: '#B9842E', name: 'Dijon Silk' },
    { hex: '#9C3B2A', name: 'Brick Velvet' },
    { hex: '#2F5E52', name: 'Forest Teal' },
    { hex: '#7A4A22', name: 'Roasted Pecan' },
  ],
  colorsToAvoid: [
    { hex: '#E7C4DD', name: 'Iced Petal' },
    { hex: '#9FB7E8', name: 'Cool Periwinkle' },
    { hex: '#F4F2EF', name: 'Snow Quartz' },
  ],
};

/** Warmth at its most luminous, autumn drifting toward spring's light. */
const WARM_AUTUMN: SeasonalPalette = {
  id: 'warm_autumn',
  name: 'Warm Autumn',
  auraDescription:
    'Soft, golden warmth. Golden-brown hair, hazel eyes, and warm, sun-touched skin. The most relaxed of the warm seasons.',
  dominantTrait: 'warm',
  secondaryTrait: 'Golden, medium-light radiance',
  boundaries: {
    hue: { min: 25, max: 60 },
    saturation: { min: 40, max: 75 },
    lightness: { min: 40, max: 65 },
  },
  signatureColors: [
    { hex: '#C68A3E', name: 'Liquid Amber' },
    { hex: '#B5662F', name: 'Spiced Persimmon' },
    { hex: '#9AA13C', name: 'Sunlit Chartreuse' },
    { hex: '#C9A24B', name: 'Antique Gold' },
    { hex: '#6E9B7E', name: 'Sage Patina' },
    { hex: '#A85C3A', name: 'Warm Sienna' },
  ],
  colorsToAvoid: [
    { hex: '#C9CBD6', name: 'Cool Pewter' },
    { hex: '#D7A8C9', name: 'Frosted Rose' },
    { hex: '#1A1A1E', name: 'Absolute Black' },
  ],
};

/* ================================================================== *
 * SPRING, warm, clear, high light. The chroma of fresh sap and sun.
 * ================================================================== */

/** Maximum clarity and saturation. The science-team anchor for Spring. */
const BRIGHT_SPRING: SeasonalPalette = {
  id: 'bright_spring',
  name: 'Bright Spring',
  auraDescription:
    'Warm and high-contrast. Bright eyes, hair with a golden glint, and skin that holds light. Best in clear, vivid color.',
  dominantTrait: 'bright',
  secondaryTrait: 'Warm, high-clarity contrast',
  boundaries: {
    hue: { min: 20, max: 70 },
    saturation: { min: 70, max: 100 },
    lightness: { min: 50, max: 80 },
  },
  signatureColors: [
    { hex: '#F26B2A', name: 'Molten Coral' },
    { hex: '#F4C430', name: 'Saffron Spark' },
    { hex: '#28B27E', name: 'Bright Jade' },
    { hex: '#27A4C9', name: 'Lacquered Turquoise' },
    { hex: '#E83F5B', name: 'Vivid Carnelian' },
    { hex: '#9ED13A', name: 'Electric Chartreuse' },
  ],
  colorsToAvoid: [
    { hex: '#8C8A86', name: 'Dust Taupe' },
    { hex: '#6E5C6B', name: 'Muted Mauve' },
    { hex: '#3A3F33', name: 'Murky Olive' },
  ],
};

/** Spring at full saturation and warmth, balanced in value. */
const TRUE_SPRING: SeasonalPalette = {
  id: 'true_spring',
  name: 'True Spring',
  auraDescription:
    'Warm and golden, with clear, sunlit coloring. Copper-honey hair and bright eyes. Fresh and lively.',
  dominantTrait: 'warm',
  secondaryTrait: 'Clear, sunlit saturation',
  boundaries: {
    hue: { min: 25, max: 75 },
    saturation: { min: 60, max: 95 },
    lightness: { min: 55, max: 78 },
  },
  signatureColors: [
    { hex: '#F58A3C', name: 'Apricot Lacquer' },
    { hex: '#F2CE3E', name: 'Buttered Citrine' },
    { hex: '#5FBE6A', name: 'Spring Leaf' },
    { hex: '#3FB6B0', name: 'Clear Lagoon' },
    { hex: '#F2685C', name: 'Warm Coral' },
    { hex: '#C7A24A', name: 'Gilded Wheat' },
  ],
  colorsToAvoid: [
    { hex: '#5A5E66', name: 'Slate Ash' },
    { hex: '#7A4A6B', name: 'Cool Plum' },
    { hex: '#0E0E12', name: 'Inkwell Black' },
  ],
};

/** Delicate, warm, and high-key, spring at its most weightless. */
const LIGHT_SPRING: SeasonalPalette = {
  id: 'light_spring',
  name: 'Light Spring',
  auraDescription:
    'Light, warm, and delicate. Pale-golden hair, light eyes, and fair skin. Best in soft, sunlit color.',
  dominantTrait: 'light',
  secondaryTrait: 'Warm, low-contrast luminosity',
  boundaries: {
    hue: { min: 30, max: 75 },
    saturation: { min: 45, max: 80 },
    lightness: { min: 68, max: 90 },
  },
  signatureColors: [
    { hex: '#F8C99B', name: 'Peach Blush' },
    { hex: '#F6E1A0', name: 'Champagne Gold' },
    { hex: '#A9DEB0', name: 'Tender Pistachio' },
    { hex: '#A7DDDE', name: 'Aquamarine Mist' },
    { hex: '#F7B4A6', name: 'Soft Salmon' },
    { hex: '#E7D7A8', name: 'Pale Straw' },
  ],
  colorsToAvoid: [
    { hex: '#2E2E36', name: 'Charcoal Noir' },
    { hex: '#7C2A4A', name: 'Cold Burgundy' },
    { hex: '#3D5A66', name: 'Heavy Teal' },
  ],
};

/* ================================================================== *
 * SUMMER, cool, hazed, soft. The chroma of fog, slate and dusk.
 * ================================================================== */

/** Gentle, greyed, low-chroma cool. The science-team anchor for Summer. */
const SOFT_SUMMER: SeasonalPalette = {
  id: 'soft_summer',
  name: 'Soft Summer',
  auraDescription:
    'Cool and muted, with low contrast. Ashy hair, soft eyes, and skin with a rose-grey tone. Best in gentle, hazy color.',
  dominantTrait: 'muted',
  secondaryTrait: 'Cool undertone with low contrast',
  boundaries: {
    hue: { min: 160, max: 260 },
    saturation: { min: 15, max: 40 },
    lightness: { min: 40, max: 65 },
  },
  signatureColors: [
    { hex: '#8C9AA6', name: 'Fog Slate' },
    { hex: '#9B8A98', name: 'Smoked Mauve' },
    { hex: '#6E8C84', name: 'Eucalyptus Grey' },
    { hex: '#A38C92', name: 'Dusty Rosewood' },
    { hex: '#7E8AA0', name: 'Storm Periwinkle' },
    { hex: '#5E7370', name: 'Muted Spruce' },
  ],
  colorsToAvoid: [
    { hex: '#FF7A1A', name: 'Loud Tangerine' },
    { hex: '#F4D21E', name: 'Acid Yellow' },
    { hex: '#0B0B0F', name: 'Hard Black' },
  ],
};

/** The coolest, most balanced summer, true blue-based softness. */
const TRUE_SUMMER: SeasonalPalette = {
  id: 'true_summer',
  name: 'True Summer',
  auraDescription:
    'Cool and soft. Ash-brown hair, grey-blue eyes, and skin with a cool undertone. Best in calm, blue-based tones.',
  dominantTrait: 'cool',
  secondaryTrait: 'Blue-based, medium softness',
  boundaries: {
    hue: { min: 180, max: 280 },
    saturation: { min: 25, max: 50 },
    lightness: { min: 45, max: 70 },
  },
  signatureColors: [
    { hex: '#5E8AA8', name: 'Atlantic Blue' },
    { hex: '#8E6E8C', name: 'Cool Wisteria' },
    { hex: '#4E8C84', name: 'Deep Seafoam' },
    { hex: '#A86E84', name: 'Soft Raspberry' },
    { hex: '#6E7EA8', name: 'Hyacinth Blue' },
    { hex: '#9AA0AE', name: 'Polished Pewter' },
  ],
  colorsToAvoid: [
    { hex: '#E8961E', name: 'Marigold' },
    { hex: '#C2451E', name: 'Rust Orange' },
    { hex: '#F2EAD0', name: 'Warm Ivory' },
  ],
};

/** Cool and high-key, summer rendered in pale, airy tints. */
const LIGHT_SUMMER: SeasonalPalette = {
  id: 'light_summer',
  name: 'Light Summer',
  auraDescription:
    'Light and cool, with soft contrast. Ashy hair, gentle eyes, and cool, fair skin. Best in pale, airy color.',
  dominantTrait: 'light',
  secondaryTrait: 'Cool, delicate low-contrast tints',
  boundaries: {
    hue: { min: 170, max: 270 },
    saturation: { min: 20, max: 45 },
    lightness: { min: 65, max: 88 },
  },
  signatureColors: [
    { hex: '#AEC9DE', name: 'Powder Sky' },
    { hex: '#CDBEDA', name: 'Iced Lavender' },
    { hex: '#B6D8CE', name: 'Pale Aquamint' },
    { hex: '#E2BFCE', name: 'Cool Petal Pink' },
    { hex: '#BFC6DE', name: 'Periwinkle Haze' },
    { hex: '#C9CFD6', name: 'Moonstone Grey' },
  ],
  colorsToAvoid: [
    { hex: '#B5450E', name: 'Burnt Sienna' },
    { hex: '#6E5A14', name: 'Olive Brass' },
    { hex: '#1C1C20', name: 'Dense Black' },
  ],
};

/* ================================================================== *
 * WINTER, cool, sharp, high contrast. The chroma of ice and lacquer.
 * ================================================================== */

/** Deep, glacial, high-saturation cool. The science-team anchor for Winter. */
const DARK_WINTER: SeasonalPalette = {
  id: 'dark_winter',
  name: 'Dark Winter',
  auraDescription:
    'Deep and cool, with sharp contrast. Near-black hair, cool eyes, and cool-toned skin. Best in dark, dramatic color.',
  dominantTrait: 'dark',
  secondaryTrait: 'Cool undertone with sharp, high contrast',
  boundaries: {
    hue: { min: 180, max: 300 },
    saturation: { min: 55, max: 90 },
    lightness: { min: 15, max: 45 },
  },
  signatureColors: [
    { hex: '#1E3A6E', name: 'Midnight Sapphire' },
    { hex: '#4A1E5C', name: 'Royal Aubergine' },
    { hex: '#0F4A4A', name: 'Deep Pine Teal' },
    { hex: '#7A123A', name: 'Black Cherry' },
    { hex: '#23304A', name: 'Inked Navy' },
    { hex: '#1A1A20', name: 'Lacquered Onyx' },
  ],
  colorsToAvoid: [
    { hex: '#E8C49A', name: 'Warm Camel' },
    { hex: '#C9A24A', name: 'Antique Gold' },
    { hex: '#D8C8A8', name: 'Buttercream' },
  ],
};

/** The coolest, purest winter, saturated, blue-based, balanced in value. */
const TRUE_WINTER: SeasonalPalette = {
  id: 'true_winter',
  name: 'True Winter',
  auraDescription:
    'Cool and clear, with high contrast. Dark hair, bright eyes, and cool skin. Best in saturated, jewel-clean color.',
  dominantTrait: 'cool',
  secondaryTrait: 'Blue-based, saturated and clear',
  boundaries: {
    hue: { min: 200, max: 320 },
    saturation: { min: 60, max: 95 },
    lightness: { min: 30, max: 60 },
  },
  signatureColors: [
    { hex: '#1457A8', name: 'Cobalt Glass' },
    { hex: '#7A1E8C', name: 'Imperial Violet' },
    { hex: '#0E8C8C', name: 'Peacock Teal' },
    { hex: '#C7184E', name: 'Crimson Lacquer' },
    { hex: '#2438A8', name: 'Ultramarine Ink' },
    { hex: '#F4F4F8', name: 'Optic Snow' },
  ],
  colorsToAvoid: [
    { hex: '#D98A3C', name: 'Pumpkin Spice' },
    { hex: '#9AA13C', name: 'Mossy Chartreuse' },
    { hex: '#E2D3B0', name: 'Sand Beige' },
  ],
};

/** Winter's high-clarity edge, cool, vivid, and luminous. */
const BRIGHT_WINTER: SeasonalPalette = {
  id: 'bright_winter',
  name: 'Bright Winter',
  auraDescription:
    'Cool and vivid, with striking contrast. Dark hair, bright eyes, and clear skin. Best in bold, icy-bright color.',
  dominantTrait: 'bright',
  secondaryTrait: 'Cool, vivid, ultra-high clarity',
  boundaries: {
    hue: { min: 190, max: 310 },
    saturation: { min: 70, max: 100 },
    lightness: { min: 45, max: 72 },
  },
  signatureColors: [
    { hex: '#1E7AE8', name: 'Electric Azure' },
    { hex: '#19C2C2', name: 'Frozen Turquoise' },
    { hex: '#B81EC2', name: 'Vivid Magenta' },
    { hex: '#E8164E', name: 'Glacial Crimson' },
    { hex: '#4A3CF2', name: 'Ionic Indigo' },
    { hex: '#19D08A', name: 'Bright Emerald' },
  ],
  colorsToAvoid: [
    { hex: '#C98A4A', name: 'Toasted Caramel' },
    { hex: '#8C7A3C', name: 'Dull Brass' },
    { hex: '#E8DAB8', name: 'Warm Oat' },
  ],
};

/* ================================================================== *
 * The matrix
 * ================================================================== */

/**
 * The canonical lookup of all twelve seasons, keyed by season `id`.
 * This is the single scientific source of truth for the application.
 */
export const SEASONS_MATRIX: SeasonMatrix = {
  // Autumn
  dark_autumn: DARK_AUTUMN,
  true_autumn: TRUE_AUTUMN,
  warm_autumn: WARM_AUTUMN,
  // Spring
  bright_spring: BRIGHT_SPRING,
  true_spring: TRUE_SPRING,
  light_spring: LIGHT_SPRING,
  // Summer
  soft_summer: SOFT_SUMMER,
  true_summer: TRUE_SUMMER,
  light_summer: LIGHT_SUMMER,
  // Winter
  dark_winter: DARK_WINTER,
  true_winter: TRUE_WINTER,
  bright_winter: BRIGHT_WINTER,
};

/** Canonical season identifiers, in editorial display order. */
export const SEASON_IDS = Object.keys(SEASONS_MATRIX) as Array<
  keyof typeof SEASONS_MATRIX
>;

/** A union of every valid season id for compile-time safety. */
export type SeasonId = (typeof SEASON_IDS)[number];

/** Ordered list of every season palette, convenient for iteration. */
export const SEASONS_LIST: SeasonalPalette[] = SEASON_IDS.map(
  (id) => SEASONS_MATRIX[id],
);
