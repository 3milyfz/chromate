import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

/**
 * Dev-only reset control.
 *
 * A small, fixed-position panel — rendered only when `import.meta.env.DEV`
 * is true, so it is tree-shaken out of production builds entirely. It exposes
 * the two state resets that are otherwise unreachable from the UI:
 *
 *   • Pre-setup — keeps the mock session but clears the analyzed season,
 *     routing back through <SeasonOnboarding /> (i.e. "before setup").
 *   • Full wipe — reverts the whole canvas to defaults and seals the archive,
 *     returning to <EnvelopeLanding />.
 */
export default function DevReset() {
  if (!import.meta.env.DEV) return null;
  return <DevResetPanel />;
}

function DevResetPanel() {
  const { isAuthenticated, seasons, setSeasons, setCurrentSeason, resetCanvas } =
    useAppContext();
  const [open, setOpen] = useState(false);

  const hasSeasons = seasons.length > 0;
  const stage = !isAuthenticated
    ? 'landing'
    : !hasSeasons
      ? 'onboarding'
      : 'dossier';

  // Return to onboarding: clear the confirmed set and the active season.
  const preSetup = () => {
    setSeasons([]);
    setCurrentSeason(null);
  };

  return (
    <div className="fixed bottom-3 right-3 z-[9999] select-none font-mono text-[11px]">
      {open ? (
        <div className="flex w-56 flex-col gap-2 rounded-md border border-white/15 bg-black/85 p-3 text-white shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="font-semibold uppercase tracking-wider text-white/70">
              Dev Reset
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-1 text-white/50 hover:text-white"
              aria-label="Close dev reset panel"
            >
              ×
            </button>
          </div>

          <div className="text-[10px] text-white/40">
            stage: <span className="text-white/70">{stage}</span>
          </div>

          <button
            type="button"
            onClick={preSetup}
            disabled={!isAuthenticated || !hasSeasons}
            className="rounded bg-amber-500/90 px-2 py-1.5 text-left font-medium text-black transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ↺ Pre-setup
            <span className="block text-[9px] font-normal opacity-70">
              keep login, redo seasons
            </span>
          </button>

          <button
            type="button"
            onClick={resetCanvas}
            className="rounded bg-red-500/90 px-2 py-1.5 text-left font-medium text-white transition-colors hover:bg-red-400"
          >
            ⨯ Full wipe
            <span className="block text-[9px] font-normal opacity-80">
              clear all + sign out
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md border border-white/15 bg-black/80 px-2.5 py-1.5 text-white/70 shadow-lg backdrop-blur transition-colors hover:text-white"
        >
          dev ⚙
        </button>
      )}
    </div>
  );
}
