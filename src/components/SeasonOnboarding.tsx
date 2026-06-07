import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { SEASONS_LIST, SEASONS_MATRIX } from '@/data/seasons';

/**
 * A concise, two-sentence meditation on each season's overall vibe — the
 * essence and aura, distilled for the onboarding preview. These are kept
 * separate from the scientific `auraDescription` so the selection moment
 * stays light, fast, and editorial.
 */
const ESSENCE_SNIPPETS: Record<string, string> = {
  dark_autumn: 'Deep and warm. Rich, low-contrast, quietly luxurious.',
  true_autumn: 'Warm and earthy. Golden, saturated, full.',
  warm_autumn: 'Soft golden warmth. Relaxed and radiant.',
  bright_spring: 'Warm and bright. Clear, high-contrast, alive.',
  true_spring: 'Golden and fresh. Clear and lively.',
  light_spring: 'Light and warm. Soft, sunlit, delicate.',
  soft_summer: 'Cool and muted. Gentle, hazy, composed.',
  true_summer: 'Cool and soft. Calm, tonal, elegant.',
  light_summer: 'Light and cool. Airy and soft.',
  dark_winter: 'Deep and cool. Sharp, dramatic, exact.',
  true_winter: 'Cool and clear. Saturated and jewel-clean.',
  bright_winter: 'Cool and vivid. Bold, icy, electric.',
};

/**
 * The four seasonal families, in editorial order. Each column collects the
 * three sub-seasons whose id ends with the family key, so the matrix reads
 * as a tidy, intuitive grouping rather than a flat list of twelve.
 */
const FAMILIES: { label: string; key: string }[] = [
  { label: 'Autumn', key: 'autumn' },
  { label: 'Spring', key: 'spring' },
  { label: 'Summer', key: 'summer' },
  { label: 'Winter', key: 'winter' },
];

/**
 * State 2 — The Immersive Canvas Selection.
 *
 * Rendered only after authentication, while no season has been confirmed.
 * A completely open, blank museum-white canvas: a warm welcome, the
 * twelve-season selection matrix grouped by family, and an isolated preview
 * of the essence (snippet + four anchor colors).
 *
 * Hovering a season previews its essence; clicking toggles it into the
 * selection (a user may have more than one best season). Selected seasons
 * carry a filled-dot indicator, and confirming persists the full set before
 * fading cleanly into the dossier.
 */
export default function SeasonOnboarding() {
  const { setCurrentSeason, setSeasons } = useAppContext();

  // The season surfaced in the preview box (driven by hover / focus / click).
  const [preview, setPreview] = useState<string | null>(null);
  // The confirmed-to-be set, toggled by clicking season names (insertion
  // order is preserved so the first pick becomes the primary season).
  const [selected, setSelected] = useState<string[]>([]);
  // Once confirming, fade the whole canvas out before the dossier mounts.
  const [confirming, setConfirming] = useState(false);

  const previewSeason = preview ? SEASONS_MATRIX[preview] : undefined;
  const count = selected.length;

  function toggle(id: string) {
    setPreview(id);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function confirm() {
    if (count === 0 || confirming) return;
    setConfirming(true);
    // Let the fade-out play, then commit — App swaps in the dossier, which
    // carries its own fade-in, completing a clean cross-dissolve.
    window.setTimeout(() => {
      setSeasons(selected);
      setCurrentSeason(selected[0]);
    }, 520);
  }

  return (
    <main
      className={`flex min-h-screen w-full items-center justify-center bg-[#FBFBFA] px-6 py-20 transition-opacity duration-500 ${
        confirming ? 'opacity-0' : 'animate-fade-in opacity-100'
      }`}
    >
      <div className="flex w-full max-w-2xl flex-col items-center text-center">
        {/* Warm welcome */}
        <h1 className="font-serif text-5xl font-light leading-[1.1] text-ink sm:text-6xl">
          Welcome to your archive.
        </h1>
        <p className="mt-6 max-w-md font-sans text-[13.5px] font-light leading-relaxed text-ash">
          Select your season. Choose more than one if several apply.
        </p>

        {/* The selection matrix — twelve seasons, grouped into family columns */}
        <nav className="mt-16 grid w-full max-w-2xl grid-cols-2 gap-x-10 gap-y-12 sm:grid-cols-4">
          {FAMILIES.map((family) => {
            const members = SEASONS_LIST.filter((s) =>
              s.id.endsWith(family.key),
            );
            return (
              <div key={family.key} className="flex flex-col items-center">
                <p className="font-serif text-base font-light italic text-stone">
                  {family.label}
                </p>
                <span className="my-4 h-px w-6 bg-ink/10" />
                <div className="flex flex-col items-center gap-3.5">
                  {members.map((season) => {
                    const isSelected = selected.includes(season.id);
                    const isPreview = season.id === preview;
                    return (
                      <button
                        key={season.id}
                        type="button"
                        aria-pressed={isSelected}
                        onMouseEnter={() => setPreview(season.id)}
                        onFocus={() => setPreview(season.id)}
                        onClick={() => toggle(season.id)}
                        className="inline-flex items-center gap-2"
                      >
                        {/* Selection indicator — a filled dot that always
                            reserves its space to keep the columns aligned. */}
                        <span
                          className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                            isSelected ? 'bg-ink' : 'bg-transparent'
                          }`}
                          aria-hidden
                        />
                        <span
                          className={`font-sans text-[10.5px] uppercase tracking-[0.22em] transition-colors duration-300 ${
                            isSelected
                              ? 'text-ink'
                              : isPreview
                                ? 'text-ash'
                                : 'text-stone hover:text-ash'
                          }`}
                        >
                          {season.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* The dynamic snippet zone — reserved space avoids any layout jump */}
        <div className="mt-14 flex min-h-[240px] w-full items-start justify-center">
          {previewSeason ? (
            <article
              key={previewSeason.id}
              className="animate-fade-in flex w-full max-w-md flex-col items-center border border-ink/10 px-10 py-11"
            >
              <p className="font-sans text-[10px] uppercase tracking-archive text-stone">
                {previewSeason.name}
              </p>

              <p className="mt-6 font-serif text-[19px] font-light italic leading-relaxed text-ink">
                {ESSENCE_SNIPPETS[previewSeason.id]}
              </p>

              {/* Anchor colors — four flat circles, strictly separated */}
              <div className="mt-10 flex items-center justify-center gap-5">
                {previewSeason.signatureColors.slice(0, 4).map((swatch) => (
                  <span
                    key={swatch.hex + swatch.name}
                    className="h-4 w-4 rounded-full border border-ink/5"
                    style={{ backgroundColor: swatch.hex }}
                    aria-hidden
                  />
                ))}
              </div>

              <p className="mt-9 font-sans text-[9.5px] uppercase tracking-[0.22em] text-stone/70">
                {selected.includes(previewSeason.id)
                  ? '✓ Selected — click to remove'
                  : 'Click to select'}
              </p>
            </article>
          ) : (
            <p className="mt-2 font-sans text-[11px] font-light italic tracking-wide text-stone/70">
              Hover a season to preview.
            </p>
          )}
        </div>

        {/* Confirmation zone — acts on the full selected set */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <p className="font-sans text-[10px] uppercase tracking-archive text-stone">
            {count === 0
              ? 'Select one or more seasons'
              : `${count} season${count > 1 ? 's' : ''} selected`}
          </p>
          <button
            type="button"
            onClick={confirm}
            disabled={count === 0}
            className="btn-line disabled:cursor-default disabled:text-stone/45 disabled:hover:tracking-archive"
          >
            {'[ Confirm Selection ]'}
          </button>
        </div>
      </div>
    </main>
  );
}
