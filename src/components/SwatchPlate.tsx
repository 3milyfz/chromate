import type { ColorSwatch } from '@/types/color';

/**
 * A single debossed circular swatch, a sunken cutout in the page, the
 * curated name beneath it, and its razor-sharp Hex coordinate.
 * Mirrors the physical paint-chip plates of the reference imagery.
 */
export function Swatch({ swatch, size = 'md' }: { swatch: ColorSwatch; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';

  return (
    <figure className="flex flex-col items-center text-center">
      <span
        className={`swatch-deboss ${dim}`}
        style={{ backgroundColor: swatch.hex }}
        aria-hidden
      />
      <figcaption className="mt-3 w-full space-y-1 px-1">
        <p className="font-sans text-[10px] uppercase leading-tight tracking-[0.16em] text-ink">
          {swatch.name}
        </p>
        <p className="font-sans text-[8.5px] uppercase tracking-[0.14em] text-stone/80">
          {swatch.hex}
        </p>
      </figcaption>
    </figure>
  );
}

/** A row/grid of swatches forming a full palette plate. */
export function SwatchPlate({ swatches }: { swatches: ColorSwatch[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-9">
      {swatches.map((swatch) => (
        <Swatch key={swatch.hex + swatch.name} swatch={swatch} />
      ))}
    </div>
  );
}
