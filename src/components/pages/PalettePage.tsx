import { useAppContext } from '@/context/AppContext';
import { SEASONS_LIST, SEASONS_MATRIX } from '@/data/seasons';
import { SwatchPlate } from '@/components/SwatchPlate';
import { PageHeading } from '@/components/pages/PageHeading';

/**
 * Left page — 01 / Visual Canvas Archive.
 * A season index on the left, the active season's aura and editorial
 * definition on the right, and its debossed signature swatch plate below.
 */
export default function PalettePage() {
  const { currentSeason, setCurrentSeason, seasons } = useAppContext();
  const active = currentSeason ? SEASONS_MATRIX[currentSeason] : undefined;

  // Only the user's confirmed seasons belong in the dossier index.
  const savedSeasons = SEASONS_LIST.filter((season) =>
    seasons.includes(season.id),
  );

  return (
    <div className="flex h-full flex-col">
      <PageHeading index="01" title="Your Palette" />

      <div className="mt-10 grid grid-cols-[minmax(110px,0.8fr)_1.4fr] gap-8">
        {/* Season index */}
        <nav className="space-y-1.5">
          {savedSeasons.map((season) => {
            const isActive = season.id === currentSeason;
            return (
              <button
                key={season.id}
                onClick={() => setCurrentSeason(season.id)}
                className={`block w-full text-left font-sans text-[11px] uppercase tracking-[0.18em] transition-all duration-300 ${
                  isActive
                    ? 'text-espresso'
                    : 'text-stone hover:text-ash'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`h-px transition-all duration-300 ${
                      isActive ? 'w-5 bg-espresso' : 'w-2 bg-stone/50'
                    }`}
                  />
                  {season.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Aura + editorial definition */}
        {active && (
          <article className="animate-fade-in">
            <p className="caption text-stone">
              {active.dominantTrait} · {active.secondaryTrait}
            </p>
            <h3 className="mt-3 font-serif text-3xl font-light italic leading-tight text-ink">
              {active.name}
            </h3>
            <p className="mt-5 text-justify text-[13px] font-light leading-relaxed text-ash">
              {active.auraDescription}
            </p>
          </article>
        )}
      </div>

      {/* Swatch plate */}
      {active && (
        <section className="mt-auto pt-12">
          <div className="mb-7 flex items-end justify-between border-t border-ink/10 pt-6">
            <p className="caption text-stone">The Signature Plate</p>
            <p className="caption text-stone/70">{active.signatureColors.length} Tones</p>
          </div>
          <SwatchPlate swatches={active.signatureColors} />
        </section>
      )}
    </div>
  );
}
