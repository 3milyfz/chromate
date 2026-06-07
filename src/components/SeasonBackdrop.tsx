import { useMemo, useState } from 'react';
import {
  getSeasonAesthetic,
  getSeasonAesthetics,
  getSeasonOverlay,
  type SeasonAesthetic,
} from '@/data/seasonAesthetics';

/**
 * SeasonBackdrop, the mood layer behind the open dossier.
 *
 * The backdrop tracks the *actively viewed* season: clicking a season in the
 * dossier's palette index changes `activeSeason`, and this layer cross-fades
 * to that season's mood image. This keeps multi-season users in sync, the
 * background always reflects the season they're currently reading.
 *
 * A frosted-glass overlay (espresso tint + backdrop blur) sits on top so the
 * espresso/linen dossier stays legible and elegant. When no active season can
 * be resolved, it falls back to a soft side-by-side split of all the user's
 * seasons; and the container carries the original `leather` surface, so if an
 * image is missing or fails to load, the dossier simply rests on the familiar
 * espresso leather instead of breaking.
 */
interface SeasonBackdropProps {
  /** The user's confirmed season ids, in selection order. */
  seasons: string[];
  /** The currently active/viewed season id, or `null` before analysis. */
  activeSeason: string | null;
}

/** A single backdrop column that hides itself if its image fails to load. */
function BackdropPanel({
  aesthetic,
  className,
}: {
  aesthetic: SeasonAesthetic;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative h-full flex-1 overflow-hidden ${className ?? ''}`}>
      {!failed && (
        <img
          src={aesthetic.imageUrl}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full animate-fade-in object-cover"
        />
      )}
    </div>
  );
}

export default function SeasonBackdrop({
  seasons,
  activeSeason,
}: SeasonBackdropProps) {
  // The active season drives the backdrop: when it resolves to an image, we
  // show that single season. Otherwise we fall back to a split of every
  // confirmed season. Either way, unmapped ids are dropped gracefully.
  const aesthetics = useMemo(() => {
    const active = activeSeason ? getSeasonAesthetic(activeSeason) : null;
    return active ? [active] : getSeasonAesthetics(seasons);
  }, [activeSeason, seasons]);

  // Keying by the resolved season ids cross-fades the layer whenever the
  // active season (or the fallback set) changes.
  const key = aesthetics.map((a) => a.id).join('+') || 'leather';

  // The frosted tint adapts to the active season's value/temperature, so
  // light/cool seasons (e.g. True Summer) stay airy instead of being crushed.
  const overlay = useMemo(
    () => getSeasonOverlay(activeSeason ?? aesthetics[0]?.id ?? null),
    [activeSeason, aesthetics],
  );

  return (
    <div
      className="leather pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* The season image(s): a single fill, or one soft column per season. */}
      <div key={key} className="absolute inset-0 flex animate-fade-in">
        {aesthetics.map((aesthetic, i) => (
          <BackdropPanel
            key={aesthetic.id}
            aesthetic={aesthetic}
            className={i > 0 ? 'border-l border-linen/10' : undefined}
          />
        ))}
      </div>

      {/* Frosted glass: blur stays; the tint adapts to the season's value so
          the image's true lightness reads through. Cross-fades on change. */}
      <div
        className={`absolute inset-0 backdrop-blur-2xl transition-colors duration-700 ${overlay.tint}`}
      />

      {/* Season-tuned vignette to seat the book without crushing light seasons. */}
      <div
        className={`absolute inset-0 transition-[background] duration-700 ${overlay.vignette}`}
      />
    </div>
  );
}
