import { useAppContext } from '@/context/AppContext';
import { SEASONS_MATRIX } from '@/data/seasons';
import { Swatch } from '@/components/SwatchPlate';
import { PageHeading } from '@/components/pages/PageHeading';

/**
 * 01 (reading) / Palette Notes, the complement to the canvas archive:
 * the disharmonious tones to keep out of the frame.
 */
export default function AvoidPage() {
  const { currentSeason } = useAppContext();
  const season = currentSeason ? SEASONS_MATRIX[currentSeason] : undefined;

  if (!season) {
    return (
      <div className="flex h-full flex-col">
        <PageHeading index="01" title="Palette Notes" />
        <p className="caption mt-10 text-stone">Select a season to see its notes.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeading index="01" title="Palette Notes" />

      <p className="mt-9 max-w-md text-justify font-serif text-[17px] font-light italic leading-relaxed text-ink">
        These shades work against {season.name}.
      </p>

      <section className="mt-12">
        <p className="caption mb-8 text-stone">Colors to Avoid</p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-8">
          {season.colorsToAvoid.map((swatch) => (
            <Swatch key={swatch.hex + swatch.name} swatch={swatch} />
          ))}
        </div>
      </section>

      <section className="mt-auto border-t border-ink/10 pt-7">
        <p className="caption text-stone">Dominant Trait</p>
        <p className="mt-2 font-serif text-2xl font-light italic text-ink">
          {season.dominantTrait} · {season.secondaryTrait}
        </p>
      </section>
    </div>
  );
}
