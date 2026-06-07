import { describe, it, expect } from 'vitest';
import {
  clamp,
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  isBackgroundPixel,
  extractDominantFromPixels,
  dominantBorderColor,
  segmentForegroundMask,
} from '@/utils/colorExtractor';

/** Builds a flat RGBA buffer by repeating each [r,g,b,a] tuple `n` times. */
function buildPixels(tuples: Array<[number, number, number, number, number]>): number[] {
  const out: number[] = [];
  for (const [r, g, b, a, count] of tuples) {
    for (let i = 0; i < count; i += 1) out.push(r, g, b, a);
  }
  return out;
}

/**
 * Paints a `width × height` RGBA grid. `paint(x, y)` returns an `[r,g,b]`
 * triplet (alpha is forced opaque) — handy for building synthetic scenes.
 */
function buildGrid(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): number[] {
  const out: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = paint(x, y);
      out.push(r, g, b, 255);
    }
  }
  return out;
}

describe('clamp', () => {
  it('bounds values to the range', () => {
    expect(clamp(-5, 0, 255)).toBe(0);
    expect(clamp(300, 0, 255)).toBe(255);
    expect(clamp(120, 0, 255)).toBe(120);
  });
});

describe('rgbToHex', () => {
  it('formats channels as uppercase #RRGGBB', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
    expect(rgbToHex(107, 74, 43)).toBe('#6B4A2B');
  });

  it('rounds and clamps out-of-gamut input', () => {
    expect(rgbToHex(-10, 300, 127.6)).toBe('#00FF80');
  });
});

describe('hexToRgb', () => {
  it('parses long-form hex', () => {
    expect(hexToRgb('#6B4A2B')).toEqual({ r: 107, g: 74, b: 43 });
  });

  it('parses short-form hex and tolerates missing #', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('rejects malformed hex', () => {
    expect(() => hexToRgb('#xyz123')).toThrow();
  });

  it('round-trips with rgbToHex', () => {
    const hex = '#A88A5E';
    const { r, g, b } = hexToRgb(hex);
    expect(rgbToHex(r, g, b)).toBe(hex);
  });
});

describe('rgbToHsl', () => {
  it('handles primary and achromatic colors', () => {
    expect(rgbToHsl(255, 0, 0)).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl(0, 255, 0)).toEqual({ h: 120, s: 100, l: 50 });
    expect(rgbToHsl(0, 0, 255)).toEqual({ h: 240, s: 100, l: 50 });
    expect(rgbToHsl(128, 128, 128)).toEqual({ h: 0, s: 0, l: 50 });
  });

  it('keeps hue in [0,360) and s/l in [0,100]', () => {
    const hsl = rgbToHsl(107, 74, 43);
    expect(hsl.h).toBeGreaterThanOrEqual(0);
    expect(hsl.h).toBeLessThan(360);
    expect(hsl.s).toBeGreaterThanOrEqual(0);
    expect(hsl.s).toBeLessThanOrEqual(100);
    expect(hsl.l).toBeGreaterThanOrEqual(0);
    expect(hsl.l).toBeLessThanOrEqual(100);
    // Burnished Chestnut is a warm, mid-dark brown.
    expect(hsl.h).toBeLessThan(45);
  });
});

describe('isBackgroundPixel', () => {
  it('flags transparent, near-white and near-black pixels', () => {
    expect(isBackgroundPixel(120, 80, 40, 10)).toBe(true); // transparent
    expect(isBackgroundPixel(250, 250, 250, 255)).toBe(true); // near-white
    expect(isBackgroundPixel(5, 5, 5, 255)).toBe(true); // near-black
  });

  it('flags the light near-neutral grey of a studio backdrop', () => {
    // A typical product-shot background — light, hueless, but below 240.
    expect(isBackgroundPixel(235, 234, 233, 255)).toBe(true);
    expect(isBackgroundPixel(220, 221, 219, 255)).toBe(true);
  });

  it('keeps genuine foreground colors', () => {
    expect(isBackgroundPixel(107, 74, 43, 255)).toBe(false); // warm brown
    expect(isBackgroundPixel(110, 30, 40, 255)).toBe(false); // burgundy
    expect(isBackgroundPixel(150, 150, 150, 255)).toBe(false); // mid grey garment
  });
});

describe('extractDominantFromPixels', () => {
  it('isolates the dominant cluster, ignoring a white background', () => {
    // 100 white background px + 60 chestnut px + 20 stray blue px.
    const pixels = buildPixels([
      [255, 255, 255, 255, 100],
      [107, 74, 43, 255, 60],
      [40, 80, 200, 255, 20],
    ]);

    const result = extractDominantFromPixels(pixels);

    expect(result.rgb.r).toBeGreaterThan(result.rgb.b); // warm, not blue
    expect(result.hsl.h).toBeLessThan(45); // warm brown hue
    expect(result.hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('falls back to neutral grey for an all-background image', () => {
    const pixels = buildPixels([
      [255, 255, 255, 255, 50],
      [0, 0, 0, 255, 50],
    ]);

    const result = extractDominantFromPixels(pixels);
    expect(result.rgb).toEqual({ r: 128, g: 128, b: 128 });
    expect(result.hsl.s).toBe(0);
  });

  it('averages pixels within the winning cluster', () => {
    // Two near-identical browns that share a bucket should average together.
    const pixels = buildPixels([
      [100, 70, 40, 255, 30],
      [110, 78, 46, 255, 30],
    ]);
    const result = extractDominantFromPixels(pixels);
    expect(result.rgb.r).toBeGreaterThanOrEqual(100);
    expect(result.rgb.r).toBeLessThanOrEqual(110);
  });

  it('recovers garment color even when the backdrop fills most of the frame', () => {
    // A tiny 4×4 garment lost in a large grey frame — only segmentation,
    // not pixel-count voting, can recover it.
    const w = 28;
    const h = 28;
    const data = buildGrid(w, h, (x, y) => {
      const inGarment = x >= 12 && x < 16 && y >= 12 && y < 16;
      return inGarment ? [118, 32, 46] : [176, 176, 176];
    });
    const result = extractDominantFromPixels(data, {}, w, h);
    expect(result.rgb.r).toBeGreaterThan(result.rgb.g);
    expect(result.rgb.r).toBeGreaterThan(result.rgb.b);
    expect(result.hsl.s).toBeGreaterThan(30);
  });

  it('isolates a centred garment from a dominant grey backdrop (spatial)', () => {
    // Simulates a product shot: a mid-grey backdrop that is NOT light enough
    // to trip the neutral filter and outnumbers the garment, with a smaller
    // burgundy garment framed in the centre. Border sampling + centre
    // weighting must still recover the garment colour.
    const w = 24;
    const h = 24;
    const bg = [178, 178, 178];
    const fg = [120, 30, 44]; // burgundy
    const data: number[] = [];
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const centred = x >= 8 && x < 16 && y >= 8 && y < 16; // 8×8 garment
        const [r, g, b] = centred ? fg : bg;
        data.push(r, g, b, 255);
      }
    }

    // Garment is far outnumbered by backdrop pixels.
    const result = extractDominantFromPixels(data, {}, w, h);

    expect(result.rgb.r).toBeGreaterThan(result.rgb.g); // warm, not grey
    expect(result.rgb.r).toBeGreaterThan(result.rgb.b);
    expect(result.hsl.s).toBeGreaterThan(30); // a real hue, not a neutral
  });
});

describe('solid-color / swatch input', () => {
  it('classifies a solid burgundy swatch as burgundy, not the backdrop', () => {
    const w = 20;
    const h = 20;
    const data = buildGrid(w, h, () => [120, 30, 44]);
    const result = extractDominantFromPixels(data, {}, w, h);
    expect(result.rgb.r).toBeGreaterThan(result.rgb.g);
    expect(result.rgb.r).toBeGreaterThan(result.rgb.b);
    expect(Math.abs(result.rgb.r - 120)).toBeLessThanOrEqual(2);
    expect(result.hsl.s).toBeGreaterThan(40); // a real hue
  });

  it('classifies a solid brown swatch correctly', () => {
    const w = 20;
    const h = 20;
    const data = buildGrid(w, h, () => [92, 62, 38]);
    const result = extractDominantFromPixels(data, {}, w, h);
    expect(result.rgb.r).toBeGreaterThan(result.rgb.b); // warm brown
    expect(Math.abs(result.rgb.r - 92)).toBeLessThanOrEqual(2);
    expect(result.hsl.h).toBeLessThan(45);
  });

  it('does not discard a flat LIGHT swatch as background', () => {
    // A light grey chip would trip the per-pixel neutral filter; the solid
    // path must still report the chip color rather than a neutral fallback.
    const w = 16;
    const h = 16;
    const data = buildGrid(w, h, () => [222, 220, 219]);
    const result = extractDominantFromPixels(data, {}, w, h);
    expect(result.rgb.r).toBeGreaterThan(200);
    expect(result.rgb.g).toBeGreaterThan(200);
  });

  it('tolerates mild noise in a near-solid swatch', () => {
    const w = 20;
    const h = 20;
    const data = buildGrid(w, h, (x, y) => {
      const jitter = ((x + y) % 5) - 2; // -2..+2
      return [120 + jitter, 30 + jitter, 44 + jitter];
    });
    const result = extractDominantFromPixels(data, {}, w, h);
    expect(Math.abs(result.rgb.r - 120)).toBeLessThanOrEqual(4);
    expect(result.rgb.r).toBeGreaterThan(result.rgb.g);
  });
});

describe('dominantBorderColor', () => {
  it('reports the backdrop even when a garment bleeds to the edge', () => {
    // Grey backdrop with a burgundy strip running top-to-bottom through the
    // centre (so it touches both edges). Grey still dominates the frame.
    const w = 20;
    const h = 20;
    const data = buildGrid(w, h, (x) =>
      x >= 9 && x <= 11 ? [120, 30, 44] : [180, 180, 180],
    );
    const backdrop = dominantBorderColor(data, w, h)!;
    expect(backdrop).not.toBeNull();
    // Backdrop is grey (channels close together), not the burgundy strip.
    expect(Math.abs(backdrop.r - backdrop.g)).toBeLessThan(12);
    expect(backdrop.r).toBeGreaterThan(150);
  });
});

describe('segmentForegroundMask', () => {
  it('keeps a garment that bleeds to the frame edge intact', () => {
    const w = 20;
    const h = 20;
    const data = buildGrid(w, h, (x) =>
      x >= 9 && x <= 11 ? [120, 30, 44] : [180, 180, 180],
    );
    const { mask, count } = segmentForegroundMask(data, w, h);

    // The 3-wide strip (3 × 20 = 60 px) survives; the fill never leaks in.
    expect(count).toBe(60);
    // A centre pixel inside the strip is foreground...
    expect(mask[10 * w + 10]).toBe(1);
    // ...and a corner backdrop pixel is not.
    expect(mask[0]).toBe(0);
  });

  it('discards stray specks, keeping only the largest blob', () => {
    const w = 24;
    const h = 24;
    const data = buildGrid(w, h, (x, y) => {
      const inGarment = x >= 8 && x < 16 && y >= 8 && y < 16; // 8×8 block
      const isSpeck = x === 1 && y === 1; // lone tag near the corner
      if (inGarment) return [120, 30, 44];
      if (isSpeck) return [30, 60, 200];
      return [178, 178, 178];
    });
    const { mask, count } = segmentForegroundMask(data, w, h);

    expect(count).toBe(64); // only the 8×8 garment
    expect(mask[1 * w + 1]).toBe(0); // speck dropped
    expect(mask[11 * w + 11]).toBe(1); // garment kept
  });
});
