import { describe, it, expect } from 'vitest';
import { analyzeColorAgainstSeason } from '@/utils/paletteMatcher';
import { SEASONS_MATRIX } from '@/data/seasons';

describe('analyzeColorAgainstSeason — validation', () => {
  it('throws on an unknown season id', () => {
    expect(() => analyzeColorAgainstSeason(40, 40, 30, 'no_such_season')).toThrow();
  });

  it('returns the queried season id', () => {
    const result = analyzeColorAgainstSeason(40, 43, 30, 'dark_autumn');
    expect(result.seasonId).toBe('dark_autumn');
  });
});

describe('analyzeColorAgainstSeason — matches', () => {
  it('passes a color at the center of Dark Autumn with a near-perfect score', () => {
    const result = analyzeColorAgainstSeason(40, 43, 30, 'dark_autumn', 'Espresso Brown');

    expect(result.isMatch).toBe(true);
    expect(result.breakdown).toEqual({
      hue: 'PASS',
      saturation: 'PASS',
      lightness: 'PASS',
    });
    expect(result.matchScore).toBeGreaterThanOrEqual(95);
    expect(result.customTextVerdict).toContain('Espresso Brown');
    expect(result.customTextVerdict.toLowerCase()).toContain('perfect');
  });

  it('passes a vivid warm color for Bright Spring', () => {
    const result = analyzeColorAgainstSeason(45, 85, 65, 'bright_spring');
    expect(result.isMatch).toBe(true);
    expect(result.matchScore).toBeGreaterThan(70);
  });

  it('grants the teal exception for Autumn jewel tones', () => {
    // Deep teal: cool-band hue that Autumns are allowed to wear.
    const result = analyzeColorAgainstSeason(190, 50, 30, 'dark_autumn');
    expect(result.breakdown.hue).toBe('PASS');
    expect(result.isMatch).toBe(true);
  });

  it('grants the olive-green exception for Autumn', () => {
    const result = analyzeColorAgainstSeason(80, 45, 35, 'dark_autumn');
    expect(result.breakdown.hue).toBe('PASS');
  });
});

describe('analyzeColorAgainstSeason — near misses', () => {
  it('fails a cool, light, muted color against Dark Autumn', () => {
    const result = analyzeColorAgainstSeason(220, 25, 55, 'dark_autumn', 'Powder Blue');

    expect(result.isMatch).toBe(false);
    expect(result.breakdown.hue).toBe('FAIL'); // wrong temperature
    expect(result.breakdown.lightness).toBe('FAIL'); // too light
    expect(result.breakdown.saturation).toBe('PASS'); // muted is fine
    expect(result.customTextVerdict).toContain('Powder Blue');
  });

  it('suggests a sister season on a near miss', () => {
    const result = analyzeColorAgainstSeason(220, 25, 55, 'dark_autumn');
    // The verdict should reference a real, different season by name.
    const otherNames = Object.values(SEASONS_MATRIX)
      .filter((s) => s.id !== 'dark_autumn')
      .map((s) => s.name);
    const mentionsSister = otherNames.some((name) =>
      result.customTextVerdict.includes(name),
    );
    expect(mentionsSister).toBe(true);
  });

  it('keeps the score low when every axis is wrong', () => {
    // Bright warm color judged against cool, muted Soft Summer.
    const result = analyzeColorAgainstSeason(35, 95, 75, 'soft_summer');
    expect(result.isMatch).toBe(false);
    expect(result.matchScore).toBeLessThan(50);
  });
});

describe('analyzeColorAgainstSeason — score bounds', () => {
  it('always returns a score within [0, 100] for every season', () => {
    for (const id of Object.keys(SEASONS_MATRIX)) {
      for (const [h, s, l] of [
        [0, 0, 0],
        [180, 50, 50],
        [359, 100, 100],
        [40, 43, 30],
      ] as const) {
        const { matchScore } = analyzeColorAgainstSeason(h, s, l, id);
        expect(matchScore).toBeGreaterThanOrEqual(0);
        expect(matchScore).toBeLessThanOrEqual(100);
      }
    }
  });
});
