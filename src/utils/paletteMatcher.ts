/**
 * Chromate: The Scientific Elimination Algorithm
 * ------------------------------------------------------------------
 * Evaluates a single measured color (in HSL) against a season's defined
 * volume in `SEASONS_MATRIX`, executing the three-step seasonal filter:
 *
 *   1. Temperature  (Hue)       , warm vs. cool, with olive/teal grace.
 *   2. Value        (Lightness) , depth threshold.
 *   3. Chroma       (Saturation), muted vs. vibrant clarity.
 *
 * It returns a verdict object with a pass/fail breakdown, a 0–100 score
 * measuring proximity to the season's ideal center, and a friendly,
 * trait-aware sentence, celebratory on a match, constructive on a miss.
 */

import type { Range, SeasonalPalette } from '@/types/color';
import { SEASONS_MATRIX } from '@/data/seasons';

/* ------------------------------------------------------------------ *
 * Result shape
 * ------------------------------------------------------------------ */

/** The outcome of a single axis test. */
export type AxisResult = 'PASS' | 'FAIL';

/** Per-axis pass/fail summary. */
export interface AnalysisBreakdown {
  hue: AxisResult;
  saturation: AxisResult;
  lightness: AxisResult;
}

/** The full evaluation returned to the UI. */
export interface SeasonAnalysis {
  /** The season this color was tested against. */
  seasonId: string;
  /** True only when all three axes pass. */
  isMatch: boolean;
  /** Proximity to the season's ideal center, `0 – 100`. */
  matchScore: number;
  /** Pass/fail for each scientific axis. */
  breakdown: AnalysisBreakdown;
  /** The season this color most naturally belongs to, across all twelve. */
  classifiedSeasonId: string;
  /** Display name of {@link classifiedSeasonId}, e.g. `Dark Autumn`. */
  classifiedSeasonName: string;
  /** A specific, friendly explanation of the outcome. */
  customTextVerdict: string;
}

/* ------------------------------------------------------------------ *
 * Season geography helpers
 * ------------------------------------------------------------------ */

type SeasonFamily = 'autumn' | 'spring' | 'summer' | 'winter';
type Temperature = 'warm' | 'cool';

/** Derives the family (autumn/spring/summer/winter) from a season id. */
function getSeasonFamily(seasonId: string): SeasonFamily {
  if (seasonId.includes('autumn')) return 'autumn';
  if (seasonId.includes('spring')) return 'spring';
  if (seasonId.includes('summer')) return 'summer';
  return 'winter';
}

/** Autumn & Spring are warm; Summer & Winter are cool. */
function getTemperature(family: SeasonFamily): Temperature {
  return family === 'autumn' || family === 'spring' ? 'warm' : 'cool';
}

/* ------------------------------------------------------------------ *
 * Math helpers
 * ------------------------------------------------------------------ */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Midpoint of a range, a season's "ideal" along that axis. */
function center(range: Range): number {
  return (range.min + range.max) / 2;
}

/** Half the width of a range. */
function halfWidth(range: Range): number {
  return (range.max - range.min) / 2 || 1; // guard against zero-width
}

/** Shortest angular distance between two hues, in degrees `[0, 180]`. */
function hueDistance(a: number, b: number): number {
  const diff = Math.abs(((a % 360) + 360) % 360 - (((b % 360) + 360) % 360));
  return Math.min(diff, 360 - diff);
}

/**
 * Proximity of a value to a range's center, `0 – 1`.
 * `1` at the exact center, `0.5` at the boundary edge, decaying to `0`
 * one full half-width beyond the edge. Hue uses circular distance.
 */
function axisProximity(distance: number, range: Range): number {
  const norm = distance / halfWidth(range); // 0 at center, 1 at edge
  return clamp(1 - norm / 2, 0, 1);
}

/* ------------------------------------------------------------------ *
 * Temperature exceptions
 * ------------------------------------------------------------------ */

/**
 * Olive greens (warm-leaning yellow-greens) legitimately belong to the
 * Autumn family even though their hue spills past the warm window.
 */
function isOliveGreen(h: number, s: number): boolean {
  return h >= 60 && h <= 130 && s <= 70;
}

/**
 * Deep teals / petrol blues read as jewel tones that Autumns and Winters
 * can wear despite sitting in the cool-green band.
 */
function isTeal(h: number): boolean {
  return h >= 160 && h <= 210;
}

/**
 * Earthy red-browns, rusts and brick tones sit right on the red wrap-around
 * (hues near 0° / 360°). At low-to-moderate saturation these are warm browns
 *, they belong to the warm families (Autumn, Spring), not the cool reds and
 * berries. Capping saturation keeps vivid cool fuchsias and pure reds out, so
 * genuinely cool colors are unaffected.
 */
function isWarmRedBrown(h: number, s: number): boolean {
  const nearRed = h >= 340 || h <= 25;
  return nearRed && s <= 60;
}

/* ------------------------------------------------------------------ *
 * Per-axis evaluation
 * ------------------------------------------------------------------ */

interface AxisEvaluation {
  pass: boolean;
  proximity: number;
}

/**
 * Step 1: Temperature. A hue passes when it lands inside the season's
 * hue window, OR sits in the broad temperature-consistent zone, OR
 * qualifies for an olive/teal exception (Autumn & Winter only).
 */
function evaluateHue(
  h: number,
  s: number,
  season: SeasonalPalette,
  family: SeasonFamily,
): AxisEvaluation {
  const { hue } = season.boundaries;
  const temperature = getTemperature(family);

  const withinWindow = h >= hue.min && h <= hue.max;

  const warmZone = h <= 70 || h >= 330;
  const coolZone = h >= 130 && h <= 320;
  const inTemperatureZone = temperature === 'warm' ? warmZone : coolZone;

  // Red wrap-around earth-tones (low-to-moderate saturation) are warm: they
  // belong to the warm families. This makes the warm/Autumn hue handling
  // robust right across the 360°→0° seam, where naive linear windows leave a
  // gap, without admitting saturated cool reds.
  const exception =
    (family === 'autumn' && (isOliveGreen(h, s) || isTeal(h))) ||
    (family === 'winter' && isTeal(h)) ||
    (temperature === 'warm' && isWarmRedBrown(h, s));

  const pass = withinWindow || inTemperatureZone || exception;

  // Proximity is measured against the window. Out-of-window passes score by
  // their circular distance to the nearest window edge (fairer for wrap-around
  // browns than distance-to-center), with a modest floor so they stay fair.
  const baseProximity = axisProximity(hueDistance(h, center(hue)), hue);
  const edgeDistance = Math.min(hueDistance(h, hue.min), hueDistance(h, hue.max));
  const edgeProximity = axisProximity(edgeDistance, hue);
  const proximity = withinWindow
    ? baseProximity
    : pass
      ? Math.max(baseProximity, edgeProximity, 0.45)
      : baseProximity;

  return { pass, proximity };
}

/** Steps 2 & 3, a generic linear-axis test for lightness / saturation. */
function evaluateLinearAxis(value: number, range: Range): AxisEvaluation {
  const pass = value >= range.min && value <= range.max;
  const proximity = axisProximity(Math.abs(value - center(range)), range);
  return { pass, proximity };
}

/* ------------------------------------------------------------------ *
 * Core evaluation (verdict-free, reusable for sister-season search)
 * ------------------------------------------------------------------ */

interface CoreEvaluation {
  isMatch: boolean;
  matchScore: number;
  breakdown: AnalysisBreakdown;
  hue: AxisEvaluation;
  saturation: AxisEvaluation;
  lightness: AxisEvaluation;
}

function evaluate(
  h: number,
  s: number,
  l: number,
  season: SeasonalPalette,
): CoreEvaluation {
  const family = getSeasonFamily(season.id);

  const hue = evaluateHue(h, s, season, family);
  const saturation = evaluateLinearAxis(s, season.boundaries.saturation);
  const lightness = evaluateLinearAxis(l, season.boundaries.lightness);

  const isMatch = hue.pass && saturation.pass && lightness.pass;
  const matchScore = Math.round(
    100 * ((hue.proximity + saturation.proximity + lightness.proximity) / 3),
  );

  return {
    isMatch,
    matchScore,
    breakdown: {
      hue: hue.pass ? 'PASS' : 'FAIL',
      saturation: saturation.pass ? 'PASS' : 'FAIL',
      lightness: lightness.pass ? 'PASS' : 'FAIL',
    },
    hue,
    saturation,
    lightness,
  };
}

/* ------------------------------------------------------------------ *
 * Sister-season discovery (for constructive near-miss verdicts)
 * ------------------------------------------------------------------ */

/** Finds the season this color harmonizes with best across the matrix. */
function findBestSeason(h: number, s: number, l: number): SeasonalPalette {
  let best: SeasonalPalette | null = null;
  let bestScore = -Infinity;
  let bestIsMatch = false;

  for (const season of Object.values(SEASONS_MATRIX)) {
    const evald = evaluate(h, s, l, season);
    // Prefer a true match; otherwise fall back to the highest raw score.
    const rank = evald.matchScore + (evald.isMatch ? 1000 : 0);
    const bestRank = bestScore + (bestIsMatch ? 1000 : 0);
    if (rank > bestRank) {
      best = season;
      bestScore = evald.matchScore;
      bestIsMatch = evald.isMatch;
    }
  }

  // The matrix is non-empty, so `best` is always assigned.
  return best as SeasonalPalette;
}

/* ------------------------------------------------------------------ *
 * Verdict authoring
 * ------------------------------------------------------------------ */

/** Pretty label for a swatch, uses the provided name or a hue family. */
function describeColor(h: number, colorName?: string): string {
  if (colorName && colorName.trim()) return colorName.trim();

  if (h < 20 || h >= 345) return 'this red';
  if (h < 45) return 'this warm brown';
  if (h < 70) return 'this golden tone';
  if (h < 160) return 'this green';
  if (h < 200) return 'this teal';
  if (h < 255) return 'this blue';
  if (h < 300) return 'this violet';
  return 'this magenta';
}

function craftMatchVerdict(
  color: string,
  season: SeasonalPalette,
): string {
  return (
    `Perfect. ${color} aligns beautifully with your ${season.dominantTrait}, ` +
    `${season.secondaryTrait.toLowerCase()} essence. It belongs in your ${season.name} ` +
    `palette and will read as effortless, intentional, and entirely you.`
  );
}

function craftNearMissVerdict(
  color: string,
  target: SeasonalPalette,
  core: CoreEvaluation,
  h: number,
  s: number,
  l: number,
): string {
  const best = findBestSeason(h, s, l);
  const reasons: string[] = [];

  if (core.breakdown.hue === 'FAIL') {
    const targetTemp = getTemperature(getSeasonFamily(target.id));
    reasons.push(
      targetTemp === 'warm'
        ? 'its undertone leans cooler than your warmth invites'
        : 'its undertone leans warmer than your coolness invites',
    );
  }
  if (core.breakdown.lightness === 'FAIL') {
    const c = center(target.boundaries.lightness);
    reasons.push(l > c ? 'it sits lighter than your depth prefers' : 'it sits deeper than your palette prefers');
  }
  if (core.breakdown.saturation === 'FAIL') {
    const c = center(target.boundaries.saturation);
    reasons.push(s > c ? 'it is more vivid than your clarity calls for' : 'it is more muted than your clarity calls for');
  }

  const reasonText =
    reasons.length > 0 ? reasons.join(', and ') : 'it drifts from your ideal center';

  if (best.id !== target.id) {
    return (
      `Not quite. Against ${target.name}, ${color} is a near miss because ${reasonText}. ` +
      `It actually harmonizes with ${best.name}, a sister season. Wear it as a considered ` +
      `accent, away from the face, or paired with a true ${target.name} neutral, and it can still sing.`
    );
  }

  return (
    `A near miss. ${color} brushes the edge of your ${target.name} palette because ${reasonText}. ` +
    `Keep it for accents rather than statement pieces, and let your core ${target.name} tones lead.`
  );
}

/* ------------------------------------------------------------------ *
 * Multi-season result shape
 * ------------------------------------------------------------------ */

/**
 * The outcome of testing one color against a *set* of selected seasons:
 * the user may belong to more than one. A color is a match if it fits ANY
 * of them.
 */
export interface MultiSeasonAnalysis {
  /** True when the color passes at least one of the selected seasons. */
  isMatch: boolean;
  /** Ids of every selected season the color genuinely fits (may be empty). */
  matchedSeasonIds: string[];
  /**
   * The strongest selected season for this color, the matched season with
   * the highest score, or (if none match) the closest selected season.
   */
  bestSeasonId: string | null;
  /** Display name of {@link bestSeasonId}, e.g. `Dark Autumn`. */
  bestSeasonName: string | null;
  /** Best proximity score across the selected seasons, `0 – 100`. */
  matchScore: number;
  /** The season the color most naturally belongs to, across all twelve. */
  classifiedSeasonId: string;
  /** Display name of {@link classifiedSeasonId}. */
  classifiedSeasonName: string;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

/**
 * Analyze a measured HSL color against a target season.
 *
 * @param h            Hue, `0 – 360`.
 * @param s            Saturation, `0 – 100`.
 * @param l            Lightness, `0 – 100`.
 * @param targetSeasonId  A key of `SEASONS_MATRIX`, e.g. `dark_autumn`.
 * @param colorName    Optional curated name for friendlier verdicts.
 * @throws If `targetSeasonId` is not present in the matrix.
 */
export function analyzeColorAgainstSeason(
  h: number,
  s: number,
  l: number,
  targetSeasonId: string,
  colorName?: string,
): SeasonAnalysis {
  const season = SEASONS_MATRIX[targetSeasonId];
  if (!season) {
    throw new Error(`Unknown season id: "${targetSeasonId}".`);
  }

  const core = evaluate(h, s, l, season);
  const color = describeColor(h, colorName);
  const classified = findBestSeason(h, s, l);

  const customTextVerdict = core.isMatch
    ? craftMatchVerdict(color, season)
    : craftNearMissVerdict(color, season, core, h, s, l);

  return {
    seasonId: season.id,
    isMatch: core.isMatch,
    matchScore: core.matchScore,
    breakdown: core.breakdown,
    classifiedSeasonId: classified.id,
    classifiedSeasonName: classified.name,
    customTextVerdict,
  };
}

/**
 * Analyze a measured HSL color against a *set* of selected seasons.
 *
 * The color counts as a match if it fits ANY of the selected seasons. The
 * result reports which selected seasons it matched, the strongest of them,
 * and, independently, the season it most naturally belongs to overall.
 *
 * Unknown ids are ignored. An empty (or fully-unknown) selection yields a
 * non-match whose `classified*` fields still describe the color's home
 * season, so callers always have something meaningful to show.
 *
 * @param h           Hue, `0 – 360`.
 * @param s           Saturation, `0 – 100`.
 * @param l           Lightness, `0 – 100`.
 * @param seasonIds   Keys of `SEASONS_MATRIX` the user has selected.
 */
export function analyzeColorAgainstSeasons(
  h: number,
  s: number,
  l: number,
  seasonIds: string[],
): MultiSeasonAnalysis {
  const classified = findBestSeason(h, s, l);

  const matchedSeasonIds: string[] = [];
  let best: { id: string; name: string; score: number; isMatch: boolean } | null =
    null;

  for (const id of seasonIds) {
    const season = SEASONS_MATRIX[id];
    if (!season) continue;

    const core = evaluate(h, s, l, season);

    // A color matches a selected season when it either passes that season's
    // strict HSL boundaries OR is classified as belonging to it (its "home").
    // The latter keeps the verdict self-consistent: a color that "reads as
    // Dark Autumn" must report a match when Dark Autumn is selected, even if
    // it brushes a boundary on one axis.
    const isClassifiedHome = season.id === classified.id;
    const matched = core.isMatch || isClassifiedHome;
    if (matched && !matchedSeasonIds.includes(season.id)) {
      matchedSeasonIds.push(season.id);
    }

    // Rank matched seasons ahead of non-matches, then by proximity score.
    const better =
      best === null ||
      (matched && !best.isMatch) ||
      (matched === best.isMatch && core.matchScore > best.score);
    if (better) {
      best = {
        id: season.id,
        name: season.name,
        score: core.matchScore,
        isMatch: matched,
      };
    }
  }

  return {
    isMatch: matchedSeasonIds.length > 0,
    matchedSeasonIds,
    bestSeasonId: best?.id ?? null,
    bestSeasonName: best?.name ?? null,
    matchScore: best?.score ?? 0,
    classifiedSeasonId: classified.id,
    classifiedSeasonName: classified.name,
  };
}
