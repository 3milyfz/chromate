import { useState, type FormEvent } from 'react';
import { useAppContext } from '@/context/AppContext';
import { PageHeading } from '@/components/pages/PageHeading';

/**
 * 04 / Brand Archive — the curated index of luxury houses the user keeps
 * on file, presented as a typeset directory with minimal add/remove.
 */
export default function BrandArchivePage() {
  const { favoriteBrands, addFavoriteBrand, removeFavoriteBrand } = useAppContext();
  const [draft, setDraft] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    addFavoriteBrand(draft);
    setDraft('');
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeading index="04" title="Brand Archive" />

      <p className="mt-9 max-w-md text-justify font-serif text-[17px] font-light italic leading-relaxed text-ink">
        The labels you keep on file.
      </p>

      <ol className="mt-11 space-y-0">
        {favoriteBrands.map((brand, i) => (
          <li
            key={brand}
            className="group flex items-baseline justify-between border-b border-ink/10 py-4"
          >
            <span className="flex items-baseline gap-4">
              <span className="font-sans text-[10px] tracking-[0.2em] text-stone/60">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-serif text-2xl font-light text-ink">{brand}</span>
            </span>
            <button
              type="button"
              onClick={() => removeFavoriteBrand(brand)}
              className="font-sans text-[10px] uppercase tracking-[0.2em] text-stone/0 transition-colors duration-200 group-hover:text-stone hover:!text-espresso"
            >
              Remove
            </button>
          </li>
        ))}
      </ol>

      <form onSubmit={submit} className="mt-auto flex items-center gap-4 pt-10">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a label…"
          className="flex-1 border-0 border-b border-ink/15 bg-transparent pb-2 font-sans text-[13px] font-light tracking-wide text-ink outline-none placeholder:text-stone/50 focus:border-ink/45"
        />
        <button type="submit" className="btn-line">
          [ Add ]
        </button>
      </form>
    </div>
  );
}
