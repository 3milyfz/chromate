import { describe, it, expect } from 'vitest';
import {
  analyzeColorAgainstSeason,
  analyzeColorAgainstSeasons,
} from '@/utils/paletteMatcher';
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

describe('analyzeColorAgainstSeasons — match any of several', () => {
  it('matches when the color fits ANY selected season', () => {
    // A deep cool jewel tone: fails Dark Autumn (warm) but fits Dark Winter.
    const result = analyzeColorAgainstSeasons(250, 70, 30, [
      'dark_autumn',
      'dark_winter',
    ]);
    expect(result.isMatch).toBe(true);
    expect(result.matchedSeasonIds).toContain('dark_winter');
    expect(result.matchedSeasonIds).not.toContain('dark_autumn');
    expect(result.bestSeasonId).toBe('dark_winter');
  });

  it('reports no match when the color fits none of the selected seasons', () => {
    // Light, cool, muted — wrong for both deep selections.
    const result = analyzeColorAgainstSeasons(220, 25, 80, [
      'dark_autumn',
      'dark_winter',
    ]);
    expect(result.isMatch).toBe(false);
    expect(result.matchedSeasonIds).toHaveLength(0);
    // Even without a match, it still names a closest selected + classified home.
    expect(result.bestSeasonId).not.toBeNull();
    expect(result.classifiedSeasonId).toBeTruthy();
  });

  it('can match more than one selected season at once', () => {
    // A center-of-Dark-Autumn brown, with Dark Autumn among the picks.
    const result = analyzeColorAgainstSeasons(40, 43, 30, [
      'dark_autumn',
      'true_autumn',
    ]);
    expect(result.isMatch).toBe(true);
    expect(result.matchedSeasonIds).toContain('dark_autumn');
  });

  it('matches when the classified home season is selected, even near a boundary', () => {
    // A warm near-red brown (~#453130): h≈3, s≈18, l≈23. It brushes Dark
    // Autumn's saturation floor, so it FAILS the strict single-season test…
    const strict = analyzeColorAgainstSeason(3, 18, 23, 'dark_autumn');
    expect(strict.isMatch).toBe(false);
    expect(strict.classifiedSeasonId).toBe('dark_autumn');

    // …yet because it "reads as" Dark Autumn and Dark Autumn is selected, the
    // multi-season verdict reports a consistent match (no contradiction).
    const result = analyzeColorAgainstSeasons(3, 18, 23, ['dark_autumn']);
    expect(result.classifiedSeasonId).toBe('dark_autumn');
    expect(result.isMatch).toBe(true);
    expect(result.matchedSeasonIds).toContain('dark_autumn');
    expect(result.bestSeasonId).toBe('dark_autumn');
    expect(result.bestSeasonName).toBe('Dark Autumn');
  });

  it('classifies warm near-red browns as Dark Autumn and matches them', () => {
    // Two real-world swatches the user hit: #453130 and #391213.
    for (const [h, s, l] of [
      [3, 18, 23], // #453130 — fails saturation floor, matches via classification
      [358, 52, 15], // #391213 — passes Dark Autumn's boundaries outright
    ] as const) {
      const result = analyzeColorAgainstSeasons(h, s, l, ['dark_autumn']);
      expect(result.classifiedSeasonId).toBe('dark_autumn');
      expect(result.isMatch).toBe(true);
      expect(result.matchedSeasonIds).toContain('dark_autumn');
    }
  });

  it('still rejects a genuinely cool color against Autumn selections', () => {
    // Cool, muted, medium color — its home is a cool season, not Autumn.
    const result = analyzeColorAgainstSeasons(220, 30, 50, [
      'dark_autumn',
      'true_autumn',
    ]);
    expect(result.isMatch).toBe(false);
    expect(result.matchedSeasonIds).toHaveLength(0);
    expect(result.classifiedSeasonId).not.toBe('dark_autumn');
    expect(result.classifiedSeasonId).not.toBe('true_autumn');
  });

  it('ignores unknown ids and handles an empty selection gracefully', () => {
    const empty = analyzeColorAgainstSeasons(40, 43, 30, []);
    expect(empty.isMatch).toBe(false);
    expect(empty.matchedSeasonIds).toHaveLength(0);
    expect(empty.classifiedSeasonName).toBeTruthy();

    const unknown = analyzeColorAgainstSeasons(40, 43, 30, ['nope', 'dark_autumn']);
    expect(unknown.isMatch).toBe(true);
    expect(unknown.matchedSeasonIds).toEqual(['dark_autumn']);
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
