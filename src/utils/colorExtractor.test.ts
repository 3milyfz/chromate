import { describe, it, expect } from 'vitest';
import {
  clamp,
  rgbToHex,
  hexToRgb,
  rgbToHsl,
  isBackgroundPixel,
  extractDominantFromPixels,
} from '@/utils/colorExtractor';

/** Builds a flat RGBA buffer by repeating each [r,g,b,a] tuple `n` times. */
function buildPixels(tuples: Array<[number, number, number, number, number]>): number[] {
  const out: number[] = [];
  for (const [r, g, b, a, count] of tuples) {
    for (let i = 0; i < count; i += 1) out.push(r, g, b, a);
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

  it('keeps genuine foreground colors', () => {
    expect(isBackgroundPixel(107, 74, 43, 255)).toBe(false);
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
});
