/**
 * Chromate: Seasonal Aesthetic Backdrops
 * ------------------------------------------------------------------
 * A curated mood image for each of the twelve seasons, the "[season]
 * vibe" that lives behind the dossier under a frosted-glass overlay.
 *
 * Each entry maps a season `id` to a stable, royalty-free Unsplash photo
 * whose palette and atmosphere echo that season's essence: golden,
 * earthen warmth for Autumn; fresh, blossoming clarity for Spring; soft,
 * misted cool for Summer; icy, dramatic depth for Winter. Same-family
 * seasons share a coherent visual temperature while staying distinct.
 *
 * URLs point at `images.unsplash.com` photo ids (not Pinterest hotlinks),
 * which are stable and hotlink-safe. Should any image fail to resolve,
 * the dossier falls back to the original espresso `leather` surface, so
 * the experience never breaks.
 */

import { SEASONS_MATRIX } from '@/data/seasons';

/** Build a sized, format-optimized Unsplash delivery URL from a photo id. */
function unsplash(photoId: string, w = 1600): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${w}&q=80`;
}

/**
 * The canonical season → backdrop image map. Verified to resolve, and
 * grouped so each of the four families reads as its own world.
 */
const SEASON_BACKDROP_PHOTOS: Record<string, string> = {
  // AUTUMN, golden forests, pressed pigment, warm patina.
  dark_autumn: 'photo-1507371341162-763b5e419408',
  true_autumn: 'photo-1476231682828-37e571bc172f',
  warm_autumn: 'photo-1457369804613-52c61a468e7d',

  // SPRING, fresh sap, blossom, clear sunlit color.
  bright_spring: 'photo-1490750967868-88aa4486c946',
  true_spring: 'photo-1516233758813-a38d024919c5',
  light_spring: 'photo-1517299321609-52687d1bc55a',

  // SUMMER, fog, slate, dusk; soft and hazed.
  soft_summer: 'photo-1470071459604-3b5ec3a7fe05',
  true_summer: 'photo-1551582045-6ec9c11d8697',
  light_summer: 'photo-1485470733090-0aae1788d5af',

  // WINTER, ice, lacquer, dramatic cool depth.
  dark_winter: 'photo-1483728642387-6c3bdd6c93e5',
  true_winter: 'photo-1547036967-23d11aacaee0',
  bright_winter: 'photo-1418985991508-e47386d96a71',
};

/** A resolved aesthetic for one season: its image and a human-facing name. */
export interface SeasonAesthetic {
  /** The season id this aesthetic belongs to. */
  id: string;
  /** Human-facing season title, e.g. `Dark Autumn`. */
  name: string;
  /** Hotlink-safe, sized Unsplash image URL for the season's mood. */
  imageUrl: string;
}

/**
 * Resolve the backdrop aesthetic for a single season id. Returns `null`
 * for unknown ids so callers can fall back to the leather surface.
 */
export function getSeasonAesthetic(
  seasonId: string,
  width = 1600,
): SeasonAesthetic | null {
  const photoId = SEASON_BACKDROP_PHOTOS[seasonId];
  if (!photoId) return null;
  return {
    id: seasonId,
    name: SEASONS_MATRIX[seasonId]?.name ?? seasonId,
    imageUrl: unsplash(photoId, width),
  };
}

/**
 * Resolve backdrop aesthetics for an ordered set of seasons, dropping any
 * ids that have no mapped image. The order of `seasonIds` is preserved so
 * the multi-season split renders primary → secondary, left → right.
 */
export function getSeasonAesthetics(
  seasonIds: string[],
  width = 1600,
): SeasonAesthetic[] {
  return seasonIds
    .map((id) => getSeasonAesthetic(id, width))
    .filter((a): a is SeasonAesthetic => a !== null);
}

/* ------------------------------------------------------------------ *
 * Frosted-glass overlay, season-adaptive tint
 * ------------------------------------------------------------------ */

/**
 * The frosted-glass overlay that sits over the backdrop image. Its tint and
 * darkness adapt to the active season so the image's true lightness shows
 * through: light/cool seasons get an airy linen wash, deep seasons keep a
 * dark espresso wash for legibility, and everything else lands in between.
 */
export interface SeasonOverlay {
  /** Tailwind background class for the frosted tint, e.g. `bg-linen/35`. */
  tint: string;
  /** Tailwind class for the seating vignette over the tint. */
  vignette: string;
  /**
   * `true` when the wash is light/airy. The dossier uses this only to reason
   * about contrast; the top bar carries its own scrim regardless.
   */
  isLight: boolean;
}

/** The three overlay tiers, from airy-light to deep-dark. */
type OverlayTier = 'airy' | 'soft' | 'deep';

const OVERLAY_BY_TIER: Record<OverlayTier, SeasonOverlay> = {
  // Light & cool, a bright linen frost; the image stays airy and luminous.
  airy: {
    tint: 'bg-linen/35',
    vignette:
      'bg-[radial-gradient(circle_at_50%_38%,transparent_0%,rgba(43,30,25,0.14)_100%)]',
    isLight: true,
  },
  // Warm/bright/mid, a gentle espresso veil, far lighter than before.
  soft: {
    tint: 'bg-espresso/35',
    vignette:
      'bg-[radial-gradient(circle_at_50%_38%,transparent_0%,rgba(43,30,25,0.30)_100%)]',
    isLight: false,
  },
  // Deep & dramatic, a richer espresso wash to hold contrast.
  deep: {
    tint: 'bg-espresso/55',
    vignette:
      'bg-[radial-gradient(circle_at_50%_38%,transparent_0%,rgba(43,30,25,0.45)_100%)]',
    isLight: false,
  },
};

/** Neutral default used for the multi-season split / unresolved seasons. */
const DEFAULT_OVERLAY = OVERLAY_BY_TIER.soft;

/**
 * Classify a season into an overlay tier from its editorial traits.
 *
 * The four families carry distinct "value" temperaments: every Summer reads
 * soft and hazy (airy), Winters run deep and dramatic, while Springs and
 * Autumns sit warm in the middle. The per-season `dominantTrait` overrides
 * this where it matters, explicitly `light` seasons go airy, `dark` ones go
 * deep, and `bright` ones (e.g. Bright Winter) stay luminous rather than dark.
 */
function overlayTierFor(seasonId: string): OverlayTier {
  const season = SEASONS_MATRIX[seasonId];
  if (!season) return 'soft';

  const trait = season.dominantTrait;
  if (trait === 'light') return 'airy';
  if (trait === 'dark') return 'deep';
  if (trait === 'bright') return 'soft';

  // Trait is warm / cool / muted, let the season family decide the value.
  if (seasonId.endsWith('summer')) return 'airy';
  if (seasonId.endsWith('winter')) return 'deep';
  return 'soft';
}

/**
 * Resolve the adaptive frosted-glass overlay for the active season. Falls
 * back to a balanced neutral wash when the season is unknown/unset (e.g. the
 * multi-season split), so the dossier always rests on a sensible tint.
 */
export function getSeasonOverlay(seasonId: string | null): SeasonOverlay {
  if (!seasonId || !SEASONS_MATRIX[seasonId]) return DEFAULT_OVERLAY;
  return OVERLAY_BY_TIER[overlayTierFor(seasonId)];
}
