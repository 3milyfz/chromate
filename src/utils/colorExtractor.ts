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
}

const DEFAULT_OPTIONS: Required<ExtractionOptions> = {
  maxDimension: 96,
  whiteThreshold: 240,
  blackThreshold: 16,
  alphaThreshold: 128,
  bucketSize: 32,
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
 * Decides whether a pixel is "background noise" — transparent, or a
 * near-pure white/black studio backdrop — and should be skipped.
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

  return isNearWhite || isNearBlack;
}

interface ColorBucket {
  count: number;
  sumR: number;
  sumG: number;
  sumB: number;
}

/**
 * The heart of the extractor. Given a flat RGBA pixel buffer, it:
 *   1. Skips background/transparent pixels.
 *   2. Quantizes each surviving pixel into a coarse color bucket.
 *   3. Finds the most populated bucket (the dominant cluster).
 *   4. Averages the *actual* pixels in that bucket for a refined color.
 *
 * Falls back to the mean of all foreground pixels when no cluster
 * dominates, and to neutral grey for a fully-background image.
 *
 * Pure and DOM-free, so it can be exercised with a hand-built array.
 */
export function extractDominantFromPixels(
  data: Uint8ClampedArray | number[],
  options: ExtractionOptions = {},
): ExtractedColor {
  const opts: Required<ExtractionOptions> = { ...DEFAULT_OPTIONS, ...options };
  const buckets = new Map<number, ColorBucket>();

  let fgCount = 0;
  let fgSumR = 0;
  let fgSumG = 0;
  let fgSumB = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (isBackgroundPixel(r, g, b, a, opts)) continue;

    fgCount += 1;
    fgSumR += r;
    fgSumG += g;
    fgSumB += b;

    const qr = Math.floor(r / opts.bucketSize);
    const qg = Math.floor(g / opts.bucketSize);
    const qb = Math.floor(b / opts.bucketSize);
    const key = (qr << 16) | (qg << 8) | qb;

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count += 1;
      bucket.sumR += r;
      bucket.sumG += g;
      bucket.sumB += b;
    } else {
      buckets.set(key, { count: 1, sumR: r, sumG: g, sumB: b });
    }
  }

  // Fully background / empty image → neutral grey.
  if (fgCount === 0) {
    const rgb: RGB = { r: 128, g: 128, b: 128 };
    return { rgb, hex: rgbToHex(rgb.r, rgb.g, rgb.b), hsl: rgbToHsl(128, 128, 128) };
  }

  // Find the dominant cluster.
  let dominant: ColorBucket | null = null;
  for (const bucket of buckets.values()) {
    if (!dominant || bucket.count > dominant.count) {
      dominant = bucket;
    }
  }

  const source =
    dominant && dominant.count > 0
      ? {
          r: dominant.sumR / dominant.count,
          g: dominant.sumG / dominant.count,
          b: dominant.sumB / dominant.count,
        }
      : { r: fgSumR / fgCount, g: fgSumG / fgCount, b: fgSumB / fgCount };

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

/**
 * Draws an image onto an offscreen canvas, downscaled so its longest
 * edge is `maxDimension`, and returns the raw RGBA pixel buffer.
 */
export function imageToPixelData(
  image: HTMLImageElement,
  maxDimension: number = DEFAULT_OPTIONS.maxDimension,
): Uint8ClampedArray {
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
  return ctx.getImageData(0, 0, width, height).data;
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
  const pixels = imageToPixelData(image, opts.maxDimension);
  return extractDominantFromPixels(pixels, opts);
}
