import { useAppContext } from '@/context/AppContext';
import { SEASONS_MATRIX } from '@/data/seasons';
import { Swatch } from '@/components/SwatchPlate';
import { PageHeading } from '@/components/pages/PageHeading';
import type { ColorSwatch } from '@/types/color';

const FACETS = ['Lip', 'Cheek', 'Eye', 'Base'] as const;

/**
 * 03 / Makeup Matcher, translates the season's signature plate into a
 * complexion edit, assigning curated tones to lip, cheek, eye and base.
 */
export default function MakeupPage() {
  const { currentSeason } = useAppContext();
  const season = currentSeason ? SEASONS_MATRIX[currentSeason] : undefined;

  if (!season) {
    return (
      <div className="flex h-full flex-col">
        <PageHeading index="03" title="Makeup Matcher" />
        <p className="caption mt-10 text-stone">Select a season to see your edit.</p>
      </div>
    );
  }

  const tones: ColorSwatch[] = season.signatureColors;

  return (
    <div className="flex h-full flex-col">
      <PageHeading index="03" title="Makeup Matcher" />

      <p className="mt-9 max-w-md text-justify font-serif text-[17px] font-light italic leading-relaxed text-ink">
        Makeup tones drawn from your {season.name} palette.
      </p>

      <div className="mt-12 space-y-9">
        {FACETS.map((facet, i) => {
          const tone = tones[i % tones.length];
          return (
            <div
              key={facet}
              className="flex items-center gap-6 border-b border-ink/10 pb-7"
            >
              <Swatch swatch={tone} size="sm" />
              <div className="flex-1">
                <p className="caption text-stone">{facet}</p>
                <p className="mt-1 font-serif text-xl font-light text-ink">
                  {tone.name}
                </p>
              </div>
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-stone/70">
                {tone.hex}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
