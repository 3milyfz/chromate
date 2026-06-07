/**
 * Chromate — Color Extraction Engine
 * ------------------------------------------------------------------
 * Extracts the single most dominant color from an uploaded image and
 * expresses it in the three vocabularies the platform speaks: RGB, Hex,
 * and HSL.
 *
 * The module is split into two layers so the science is fully unit
 * testable without a browser:
 *
 *   • PURE layer — color-space math and the clustering/quantization
 *     algorithm, operating on plain pixel arrays. No DOM required.
 *   • BROWSER layer — thin wrappers that load a `File` onto an HTML5
 *     Canvas, downscale it, and hand the pixel buffer to the pure layer.
 */

import type { HSL } from '@/types/color';

/* ------------------------------------------------------------------ *
 * Color primitives
 * ------------------------------------------------------------------ */

/** A color in the 0–255 RGB cube. */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** The result of an extraction, in all three color vocabularies. */
export interface ExtractedColor {
  rgb: RGB;
  /** Hex string including the leading `#`, e.g. `#6B5B3E`. */
  hex: string;
  hsl: HSL;
}

/** Tuning knobs for the extraction algorithm. */
export interface ExtractionOptions {
  /**
   * The longest edge the image is downscaled to before sampling.
   * Smaller is faster; 96px is plenty for a stable dominant color.
   */
  maxDimension?: number;
  /** Pixels brighter than this on every channel are treated as background. */
  whiteThreshold?: number;
  /** Pixels darker than this on every channel are treated as background. */
  blackThreshold?: number;
  /** Alpha below this (0–255) is treated as transparent and skipped. */
  alphaThreshold?: number;
  /** Channel bucket size for clustering. Larger = coarser clusters. */
  bucketSize?: number;
  /**
   * Pixels lighter than this whose channels are near-neutral (a studio
   * backdrop is rarely pure white — it's an off-white or light grey) are
   * treated as background even when they fall below `whiteThreshold`.
   */
  neutralLightThreshold?: number;
  /** Max channel spread (max−min) for a light pixel to read as neutral. */
  neutralChromaThreshold?: number;
  /**
   * When the image grid is known, edge pixels within this max RGB distance
   * of the sampled backdrop colour are discarded as background.
   */
  backgroundTolerance?: number;
  /**
   * Max RGB distance from the backdrop reference for a pixel to be absorbed
   * into the background region during edge flood-fill segmentation. Looser
   * than `backgroundTolerance` so soft shadows and gradients are swallowed.
   */
  segmentTolerance?: number;
  /**
   * If the segmented garment occupies less than this fraction of the frame,
   * the result is treated as unreliable and the simpler per-pixel filter is
   * used instead — a safety net against over-segmentation.
   */
  minForegroundFraction?: number;
  /**
   * Below this overall color spread (the combined RGB standard deviation of
   * the image), the upload is treated as a flat swatch / solid color chip:
   * segmentation is skipped and the overall average color is used directly.
   */
  solidVarianceThreshold?: number;
  /**
   * If segmentation cannot separate a figure from its ground — i.e. it labels
   * essentially the whole frame as one region — the image is also treated as
   * a solid color. This is that "essentially one region" fraction.
   */
  solidForegroundFraction?: number;
  /**
   * How strongly centred pixels are favoured over edge pixels, `0 – 1`.
   * Garments in product shots are framed centrally, so weighting toward
   * the centre keeps stray backdrop pixels from winning. Spatial only.
   */
  centerBias?: number;
}

const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  maxDimension: 96,
  whiteThreshold: 240,
  blackThreshold: 16,
  alphaThreshold: 128,
  bucketSize: 32,
  neutralLightThreshold: 200,
  neutralChromaThreshold: 18,
  backgroundTolerance: 26,
  segmentTolerance: 42,
  minForegroundFraction: 0.02,
  solidVarianceThreshold: 14,
  solidForegroundFraction: 0.97,
  centerBias: 0.5,
};

/* ================================================================== *
 * PURE layer — color-space math
 * ================================================================== */

/** Clamps a number into the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Converts a single 0–255 channel to a two-character hex pair. */
function channelToHex(value: number): string {
  return clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');
}

/** Converts an RGB triplet to an uppercase `#RRGGBB` hex string. */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`.toUpperCase();
}

/** Parses a `#RGB` or `#RRGGBB` hex string into an {@link RGB} triplet. */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace(/^#/, '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Converts an RGB triplet (0–255) to HSL.
 * Returns `h` in `[0, 360)`, `s` and `l` in `[0, 100]`.
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  const rn = clamp(r, 0, 255) / 255;
  const gn = clamp(g, 0, 255) / 255;
  const bn = clamp(b, 0, 255) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));

    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
        break;
    }

    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h: Math.round(h % 360),
    s: Math.round(clamp(s * 100, 0, 100)),
    l: Math.round(clamp(l * 100, 0, 100)),
  };
}

/* ================================================================== *
 * PURE layer — background detection & clustering
 * ================================================================== */

/**
 * Decides whether a pixel is "background noise" — transparent, a near-pure
 * white/black studio backdrop, or the light near-neutral grey that most
 * product photography actually uses — and should be skipped.
 */
export function isBackgroundPixel(
  r: number,
  g: number,
  b: number,
  a: number,
  options: Required<ExtractionOptions> = DEFAULT_OPTIONS,
): boolean {
  if (a < options.alphaThreshold) return true;

  const isNearWhite =
    r >= options.whiteThreshold &&
    g >= options.whiteThreshold &&
    b >= options.whiteThreshold;

  const isNearBlack =
    r <= options.blackThreshold &&
    g <= options.blackThreshold &&
    b <= options.blackThreshold;

  // A studio backdrop is seldom pure white — it photographs as an off-white
  // or light grey. Reject any light pixel whose channels sit close together
  // (i.e. it carries no real hue), which leaves true garment colour behind.
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const isLightNeutral =
    min >= options.neutralLightThreshold &&
    max - min <= options.neutralChromaThreshold;

  return isNearWhite || isNearBlack || isLightNeutral;
}

interface ColorBucket {
  weight: number;
  sumR: number;
  sumG: number;
  sumB: number;
}

/** Straight-line distance between two colors in the RGB cube. */
function colorDistance(
  r: number,
  g: number,
  b: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const dr = r - r2;
  const dg = g - g2;
  const db = b - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Estimates the backdrop color by averaging the thin frame of pixels around
 * the image edge — where a product shot's studio background lives. Returns
 * `null` if the frame is essentially transparent (a cut-out PNG).
 */
export function sampleBorderBackground(
  data: Uint8ClampedArray | number[],
  width: number,
  height: number,
  options: Required<ExtractionOptions> = DEFAULT_OPTIONS,
): RGB | null {
  const margin = Math.max(1, Math.round(Math.min(width, height) * 0.06));
  let count = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let y = 0; y < height; y += 1) {
    const onVerticalEdge = y < margin || y >= height - margin;
    for (let x = 0; x < width; x += 1) {
      const onEdge = onVerticalEdge || x < margin || x >= width - margin;
      if (!onEdge) continue;

      const i = (y * width + x) * 4;
      if (data[i + 3] < options.alphaThreshold) continue;

      sumR += data[i];
      sumG += data[i + 1];
      sumB += data[i + 2];
      count += 1;
    }
  }

  if (count === 0) return null;
  return {
    r: sumR / count,
    g: sumG / count,
    b: sumB / count,
  };
}

/**
 * Finds the *dominant* backdrop color by clustering the edge-frame pixels and
 * returning the average of the largest cluster. More robust than a plain mean
 * when a garment bleeds to the frame edge (which would skew a naive average).
 * Returns `null` if the frame is essentially transparent (a cut-out PNG).
 */
export function dominantBorderColor(
  data: Uint8ClampedArray | number[],
  width: number,
  height: number,
  options: Required<ExtractionOptions> = DEFAULT_OPTIONS,
): RGB | null {
  const margin = Math.max(1, Math.round(Math.min(width, height) * 0.06));
  const buckets = new Map<number, ColorBucket>();

  for (let y = 0; y < height; y += 1) {
    const onVerticalEdge = y < margin || y >= height - margin;
    for (let x = 0; x < width; x += 1) {
      const onEdge = onVerticalEdge || x < margin || x >= width - margin;
      if (!onEdge) continue;

      const i = (y * width + x) * 4;
      if (data[i + 3] < options.alphaThreshold) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const key =
        (Math.floor(r / options.bucketSize) << 16) |
        (Math.floor(g / options.bucketSize) << 8) |
        Math.floor(b / options.bucketSize);

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.weight += 1;
        bucket.sumR += r;
        bucket.sumG += g;
        bucket.sumB += b;
      } else {
        buckets.set(key, { weight: 1, sumR: r, sumG: g, sumB: b });
      }
    }
  }

  let dominant: ColorBucket | null = null;
  for (const bucket of buckets.values()) {
    if (!dominant || bucket.weight > dominant.weight) dominant = bucket;
  }

  if (!dominant) return null;
  return {
    r: dominant.sumR / dominant.weight,
    g: dominant.sumG / dominant.weight,
    b: dominant.sumB / dominant.weight,
  };
}

/**
 * Keeps only the single largest 4-connected blob in a binary mask, zeroing
 * out everything else. This discards stray specks (brand tags, hangers,
 * reflections) so a single garment silhouette remains.
 */
function keepLargestComponent(
  mask: Uint8Array,
  width: number,
  height: number,
): { mask: Uint8Array; count: number } {
  const n = width * height;
  const label = new Int32Array(n).fill(-1);
  const queue = new Int32Array(n);
  let bestLabel = -1;
  let bestSize = 0;
  let current = 0;

  for (let start = 0; start < n; start += 1) {
    if (mask[start] === 0 || label[start] !== -1) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    label[start] = current;
    let size = 0;

    while (head < tail) {
      const p = queue[head++];
      size += 1;
      const x = p % width;
      const y = (p - x) / width;

      if (x > 0 && mask[p - 1] && label[p - 1] === -1) {
        label[p - 1] = current;
        queue[tail++] = p - 1;
      }
      if (x < width - 1 && mask[p + 1] && label[p + 1] === -1) {
        label[p + 1] = current;
        queue[tail++] = p + 1;
      }
      if (y > 0 && mask[p - width] && label[p - width] === -1) {
        label[p - width] = current;
        queue[tail++] = p - width;
      }
      if (y < height - 1 && mask[p + width] && label[p + width] === -1) {
        label[p + width] = current;
        queue[tail++] = p + width;
      }
    }

    if (size > bestSize) {
      bestSize = size;
      bestLabel = current;
    }
    current += 1;
  }

  const out = new Uint8Array(n);
  if (bestLabel === -1) return { mask: out, count: 0 };
  for (let p = 0; p < n; p += 1) out[p] = label[p] === bestLabel ? 1 : 0;
  return { mask: out, count: bestSize };
}

/**
 * Segments the garment from its backdrop using edge-seeded region growing —
 * a classic "magic-wand from the borders" technique:
 *
 *   1. Estimate the dominant backdrop color from the edge frame.
 *   2. Flood-fill inward from every border pixel, absorbing any pixel that
 *      matches the backdrop (or is transparent) into the background region.
 *      Growth is gated on similarity to the *global* backdrop reference, so
 *      the fill cannot leak across a garment that happens to touch the edge.
 *   3. Whatever the fill never reached is foreground; keep its largest blob.
 *
 * Returns a per-pixel `1 = garment / 0 = background` mask and the garment
 * pixel count. A `null` backdrop (cut-out PNG) falls back to transparency.
 */
export function segmentForegroundMask(
  data: Uint8ClampedArray | number[],
  width: number,
  height: number,
  options: Required<ExtractionOptions> = DEFAULT_OPTIONS,
): { mask: Uint8Array; count: number } {
  const n = width * height;
  const backdrop = dominantBorderColor(data, width, height, options);
  const isBg = new Uint8Array(n);
  const queue = new Int32Array(n);
  let tail = 0;

  const matchesBackground = (p: number): boolean => {
    const i = p * 4;
    if (data[i + 3] < options.alphaThreshold) return true;
    if (!backdrop) return false;
    return (
      colorDistance(
        data[i],
        data[i + 1],
        data[i + 2],
        backdrop.r,
        backdrop.g,
        backdrop.b,
      ) <= options.segmentTolerance
    );
  };

  // Seed the flood-fill from every border pixel that reads as background.
  const seed = (p: number) => {
    if (!isBg[p] && matchesBackground(p)) {
      isBg[p] = 1;
      queue[tail++] = p;
    }
  };
  for (let x = 0; x < width; x += 1) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  // Grow the background region inward.
  let head = 0;
  while (head < tail) {
    const p = queue[head++];
    const x = p % width;
    const y = (p - x) / width;
    const neighbors = [
      x > 0 ? p - 1 : -1,
      x < width - 1 ? p + 1 : -1,
      y > 0 ? p - width : -1,
      y < height - 1 ? p + width : -1,
    ];
    for (const q of neighbors) {
      if (q < 0 || isBg[q]) continue;
      if (matchesBackground(q)) {
        isBg[q] = 1;
        queue[tail++] = q;
      }
    }
  }

  // Foreground = opaque pixels the background fill never reached.
  const fg = new Uint8Array(n);
  for (let p = 0; p < n; p += 1) {
    if (isBg[p]) continue;
    if (data[p * 4 + 3] < options.alphaThreshold) continue;
    fg[p] = 1;
  }

  return keepLargestComponent(fg, width, height);
}

/** Summary statistics of an image's opaque pixels. */
export interface FlatnessStats {
  /** Mean color across all opaque pixels, or `null` if none are opaque. */
  mean: RGB | null;
  /** Combined RGB standard deviation — how much color varies across the image. */
  spread: number;
  /** Number of opaque pixels considered. */
  opaqueCount: number;
}

/**
 * Measures how uniform an image is by computing the mean color and the
 * combined standard deviation across its opaque pixels. A flat swatch has a
 * spread near zero; a real photograph (garment + backdrop) spreads widely.
 */
export function flatnessStats(
  data: Uint8ClampedArray | number[],
  options: Required<ExtractionOptions> = DEFAULT_OPTIONS,
): FlatnessStats {
  let n = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumR2 = 0;
  let sumG2 = 0;
  let sumB2 = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < options.alphaThreshold) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    n += 1;
    sumR += r;
    sumG += g;
    sumB += b;
    sumR2 += r * r;
    sumG2 += g * g;
    sumB2 += b * b;
  }

  if (n === 0) return { mean: null, spread: 0, opaqueCount: 0 };

  const meanR = sumR / n;
  const meanG = sumG / n;
  const meanB = sumB / n;
  const varR = Math.max(0, sumR2 / n - meanR * meanR);
  const varG = Math.max(0, sumG2 / n - meanG * meanG);
  const varB = Math.max(0, sumB2 / n - meanB * meanB);

  return {
    mean: { r: meanR, g: meanG, b: meanB },
    spread: Math.sqrt(varR + varG + varB),
    opaqueCount: n,
  };
}

/** Wraps an RGB triplet as a fully-resolved {@link ExtractedColor}. */
function toExtractedColor(rgb: RGB): ExtractedColor {
  const out: RGB = {
    r: Math.round(rgb.r),
    g: Math.round(rgb.g),
    b: Math.round(rgb.b),
  };
  return {
    rgb: out,
    hex: rgbToHex(out.r, out.g, out.b),
    hsl: rgbToHsl(out.r, out.g, out.b),
  };
}

/**
 * The heart of the extractor. Given a flat RGBA pixel buffer, it:
 *   1. Skips background/transparent pixels.
 *   2. Quantizes each surviving pixel into a coarse color bucket.
 *   3. Finds the most populated bucket (the dominant cluster).
 *   4. Averages the *actual* pixels in that bucket for a refined color.
 *
 * When the image `width`/`height` grid is supplied, it additionally samples
 * the backdrop from the edge frame, discards pixels close to it, and weights
 * central pixels more heavily — so a centred garment beats a large backdrop.
 *
 * Falls back to the mean of all foreground pixels when no cluster
 * dominates, and to neutral grey for a fully-background image.
 *
 * Pure and DOM-free, so it can be exercised with a hand-built array.
 */
export function extractDominantFromPixels(
  data: Uint8ClampedArray | number[],
  options: ExtractionOptions = {},
  width?: number,
  height?: number,
): ExtractedColor {
  const opts: Required<ExtractionOptions> = { ...DEFAULT_OPTIONS, ...options };
  const spatial =
    typeof width === 'number' &&
    typeof height === 'number' &&
    width > 0 &&
    height > 0 &&
    width * height * 4 <= data.length;

  // Detect the garment silhouette via edge-seeded region growing. When the
  // segmented object is large enough to trust, sampling is restricted to it.
  let garmentMask: Uint8Array | null = null;
  let segmentCount: number | null = null;
  if (spatial) {
    const w = width as number;
    const h = height as number;
    const segmented = segmentForegroundMask(data, w, h, opts);
    segmentCount = segmented.count;
    if (segmented.count >= w * h * opts.minForegroundFraction) {
      garmentMask = segmented.mask;
    }
  }

  // Solid-color / swatch path: a flat color chip has almost no variance, or
  // segmentation finds no figure/ground separation. In that case there is no
  // garment to isolate — classify the overall average color directly.
  const stats = flatnessStats(data, opts);
  const totalPixels = spatial ? (width as number) * (height as number) : 0;
  const lowVariance = stats.opaqueCount > 0 && stats.spread <= opts.solidVarianceThreshold;
  const degenerateSegmentation =
    spatial &&
    segmentCount !== null &&
    (segmentCount === 0 || segmentCount >= totalPixels * opts.solidForegroundFraction);

  if ((lowVariance || degenerateSegmentation) && stats.mean) {
    return toExtractedColor(stats.mean);
  }

  const cx = ((width ?? 0) - 1) / 2;
  const cy = ((height ?? 0) - 1) / 2;
  const maxRadius = Math.max(1, Math.hypot(cx, cy));

  const buckets = new Map<number, ColorBucket>();

  let fgWeight = 0;
  let fgSumR = 0;
  let fgSumG = 0;
  let fgSumB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    const p = i / 4;

    if (garmentMask) {
      // Trust the segmentation: sample only the detected garment.
      if (garmentMask[p] === 0) continue;
    } else if (isBackgroundPixel(r, g, b, a, opts)) {
      continue;
    }

    // Favor centred pixels — the garment is framed in the middle.
    let weight = 1;
    if (spatial) {
      const px = p % (width as number);
      const py = Math.floor(p / (width as number));
      const radius = Math.hypot(px - cx, py - cy) / maxRadius;
      weight = 1 + opts.centerBias * (1 - radius);
    }

    fgWeight += weight;
    fgSumR += r * weight;
    fgSumG += g * weight;
    fgSumB += b * weight;

    const qr = Math.floor(r / opts.bucketSize);
    const qg = Math.floor(g / opts.bucketSize);
    const qb = Math.floor(b / opts.bucketSize);
    const key = (qr << 16) | (qg << 8) | qb;

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.weight += weight;
      bucket.sumR += r * weight;
      bucket.sumG += g * weight;
      bucket.sumB += b * weight;
    } else {
      buckets.set(key, {
        weight,
        sumR: r * weight,
        sumG: g * weight,
        sumB: b * weight,
      });
    }
  }

  // Fully background / empty image → neutral grey.
  if (fgWeight === 0) {
    const rgb: RGB = { r: 128, g: 128, b: 128 };
    return { rgb, hex: rgbToHex(rgb.r, rgb.g, rgb.b), hsl: rgbToHsl(128, 128, 128) };
  }

  // Find the dominant cluster.
  let dominant: ColorBucket | null = null;
  for (const bucket of buckets.values()) {
    if (!dominant || bucket.weight > dominant.weight) {
      dominant = bucket;
    }
  }

  const source =
    dominant && dominant.weight > 0
      ? {
          r: dominant.sumR / dominant.weight,
          g: dominant.sumG / dominant.weight,
          b: dominant.sumB / dominant.weight,
        }
      : { r: fgSumR / fgWeight, g: fgSumG / fgWeight, b: fgSumB / fgWeight };

  const rgb: RGB = {
    r: Math.round(source.r),
    g: Math.round(source.g),
    b: Math.round(source.b),
  };

  return {
    rgb,
    hex: rgbToHex(rgb.r, rgb.g, rgb.b),
    hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
  };
}

/* ================================================================== *
 * BROWSER layer — File → Canvas → pixels
 * ================================================================== */

/** Loads an image `File`/`Blob` into a decoded `HTMLImageElement`. */
export function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Chromate: failed to decode the uploaded image.'));
    };

    image.src = url;
  });
}

/** A downscaled pixel buffer together with its grid dimensions. */
export interface PixelGrid {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Draws an image onto an offscreen canvas, downscaled so its longest
 * edge is `maxDimension`, and returns the raw RGBA pixel buffer along with
 * the grid dimensions needed for spatial (backdrop + centre) analysis.
 */
export function imageToPixelData(
  image: HTMLImageElement,
  maxDimension: number = DEFAULT_OPTIONS.maxDimension,
): PixelGrid {
  const { naturalWidth: w, naturalHeight: h } = image;
  const scale = Math.min(1, maxDimension / Math.max(w, h));
  const width = Math.max(1, Math.round(w * scale));
  const height = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Chromate: 2D canvas context is unavailable.');
  }

  ctx.drawImage(image, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height };
}

/**
 * The public extractor: takes an uploaded image `File` and resolves to
 * its dominant color in RGB, Hex, and HSL. Browser-only.
 */
export async function extractDominantColor(
  file: Blob,
  options: ExtractionOptions = {},
): Promise<ExtractedColor> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const image = await loadImageFromFile(file);
  const { data, width, height } = imageToPixelData(image, opts.maxDimension);
  return extractDominantFromPixels(data, opts, width, height);
}
