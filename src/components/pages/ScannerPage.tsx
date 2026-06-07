import { useRef, useState, type DragEvent } from 'react';
import { useAppContext } from '@/context/AppContext';
import { extractDominantColor, type ExtractedColor } from '@/utils/colorExtractor';
import {
  analyzeColorAgainstSeasons,
  type MultiSeasonAnalysis,
} from '@/utils/paletteMatcher';
import { PageHeading } from '@/components/pages/PageHeading';

interface ScanResult {
  imageUrl: string;
  color: ExtractedColor;
  analysis: MultiSeasonAnalysis;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Right page — 02 / The Scanner File.
 * A vellum drop zone, a pinned polaroid of the upload, the scientific
 * verdict matrix, the friendly verdict, and the compiling closet row.
 */
export default function ScannerPage() {
  const { seasons, virtualCloset, addClosetItem } = useAppContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [appended, setAppended] = useState(false);

  const hasSeasons = seasons.length > 0;

  async function handleFile(file: File | undefined) {
    if (!file || !hasSeasons) return;
    setBusy(true);
    setAppended(false);
    try {
      const [dataUrl, color] = await Promise.all([
        readAsDataUrl(file),
        extractDominantColor(file),
      ]);
      const analysis = analyzeColorAgainstSeasons(
        color.hsl.h,
        color.hsl.s,
        color.hsl.l,
        seasons,
      );
      setResult({ imageUrl: dataUrl, color, analysis });
    } catch {
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  function append() {
    if (!result) return;
    addClosetItem({
      imageUrl: result.imageUrl,
      extractedHex: result.color.hex,
      extractedHsl: result.color.hsl,
      matchScore: result.analysis.matchScore,
    });
    setAppended(true);
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeading index="02" title="The Scanner File" />

      {/* Drop zone — vellum sheet clipped over the page */}
      <div className="relative mt-10">
        <span className="absolute -top-3 left-10 z-20 h-7 w-7 rounded-full border border-stone/50" style={{ clipPath: 'inset(0 0 50% 0)' }} aria-hidden />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`vellum flex min-h-[120px] cursor-pointer items-center justify-center rounded-[2px] border border-dashed px-8 py-8 text-center transition-colors duration-300 ${
            dragging ? 'border-espresso/50 bg-white/60' : 'border-stone/40'
          }`}
        >
          <p className="font-sans text-[11px] font-light uppercase tracking-[0.2em] text-ash">
            {busy ? 'Reading color…' : 'Drop a clothing or product image to scan.'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
      </div>

      {!hasSeasons && (
        <p className="caption mt-6 text-stone">
          Select a season to begin scanning.
        </p>
      )}

      {result && hasSeasons && (
        <div className="mt-10 grid grid-cols-[auto_1fr] items-center gap-8">
          {/* Pinned polaroid */}
          <figure className="relative w-36 rotate-[-2deg] bg-white p-2 pb-7 shadow-plate">
            <svg
              className="absolute -top-3 left-1/2 z-10 -translate-x-1/2"
              width="18"
              height="46"
              viewBox="0 0 18 46"
              fill="none"
            >
              <path
                d="M9 4 v34 a4.5 4.5 0 0 1 -9 0 v-28 a3 3 0 0 1 6 0 v26"
                transform="translate(3 0)"
                stroke="#8d847a"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <img
              src={result.imageUrl}
              alt="Scanned item"
              className="h-32 w-full object-cover"
            />
            <figcaption className="caption mt-2 flex items-center justify-center gap-2 text-stone">
              <span
                className="inline-block h-3 w-3 rounded-full border border-ink/15"
                style={{ backgroundColor: result.color.hex }}
                aria-hidden
              />
              {result.color.hex}
            </figcaption>
          </figure>

          {/* Minimal verdict — palette + match */}
          <div>
            <p className="caption text-stone">Reads as</p>
            <p className="mt-1 font-serif text-3xl font-light leading-tight text-espresso">
              {result.analysis.classifiedSeasonName}
            </p>

            <div className="mt-6 flex items-center gap-2.5 border-t border-ink/10 pt-5">
              <span
                className={`h-2.5 w-2.5 ${
                  result.analysis.isMatch
                    ? 'bg-espresso'
                    : 'border border-stone/60 bg-transparent'
                }`}
                aria-hidden
              />
              <span className="font-sans text-[12px] uppercase tracking-[0.18em] text-ink">
                {result.analysis.isMatch
                  ? `In your palette`
                  : 'Outside your palette'}
              </span>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={append}
            disabled={appended}
            className="btn-line disabled:cursor-default disabled:text-stone"
          >
            {appended ? '[ Added ]' : '[ Add to Closet ]'}
          </button>
        </div>
      )}

      {/* Compiling closet row */}
      <div className="mt-auto pt-10">
        <div className="mb-4 flex items-end justify-between border-t border-ink/10 pt-6">
          <p className="caption text-stone">Virtual Closet</p>
          <p className="caption text-stone/70">{virtualCloset.length} Items</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {virtualCloset.length === 0 && (
            <p className="font-sans text-[11px] font-light italic text-stone/70">
              Empty for now. Scan your first item above.
            </p>
          )}
          {virtualCloset.map((item) => (
            <div
              key={item.id}
              className="relative h-12 w-12 overflow-hidden border border-ink/10 bg-white"
              title={`${item.extractedHex} · ${item.matchScore}%`}
            >
              <img
                src={item.imageUrl}
                alt="Closet item"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
