import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import SeasonBackdrop from '@/components/SeasonBackdrop';
import PalettePage from '@/components/pages/PalettePage';
import ScannerPage from '@/components/pages/ScannerPage';
import MakeupPage from '@/components/pages/MakeupPage';
import BrandArchivePage from '@/components/pages/BrandArchivePage';
import AvoidPage from '@/components/pages/AvoidPage';

type TabKey = 'palette' | 'scanner' | 'makeup' | 'brand';

const TABS: { key: TabKey; index: string; label: string }[] = [
  { key: 'palette', index: '01', label: 'Your Palette' },
  { key: 'scanner', index: '02', label: 'Scanner File' },
  // { key: 'makeup', index: '03', label: 'Makeup Matcher' },
  // { key: 'brand', index: '04', label: 'Brand Archive' },
];

/**
 * State 2 — The Open Dossier.
 * A two-page, ring-bound spread on espresso leather. The left page holds
 * the Visual Canvas Archive; the right page is driven by the index tabs.
 */
export default function Dossier() {
  const { session, logout, seasons, currentSeason } = useAppContext();
  const [active, setActive] = useState<TabKey>('scanner');

  const rightPage = {
    palette: <AvoidPage />,
    scanner: <ScannerPage />,
    makeup: <MakeupPage />,
    brand: <BrandArchivePage />,
  }[active];

  return (
    <main className="relative min-h-screen w-full overflow-x-auto bg-espresso">
      {/* Season-aesthetic mood image(s) behind a frosted-glass overlay. */}
      <SeasonBackdrop seasons={seasons} activeSeason={currentSeason} />

      {/* Top scrim — keeps the light linen top-bar text readable on any
          overlay, including the airy washes used for light/cool seasons. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-32 bg-gradient-to-b from-espresso/55 to-transparent" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="font-serif text-lg font-light uppercase tracking-editorial text-linen/90">
          Chromate
        </span>
        <div className="flex items-center gap-6">
          {session && (
            <span className="hidden font-sans text-[10px] uppercase tracking-[0.2em] text-linen/45 sm:inline">
              {session.email}
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="font-sans text-[10px] uppercase tracking-archive text-linen/55 transition-colors duration-300 hover:text-linen"
          >
            [ Seal Archive ]
          </button>
        </div>
      </div>

      {/* The open book */}
      <div className="relative z-10 flex min-h-[calc(100vh-120px)] items-start justify-center px-6 pb-20 pt-2 animate-fade-in">
        <div className="relative flex h-[780px] w-[940px] shrink-0 shadow-page">
          {/* Left page — fixed spread height; inner scroll when content overflows. */}
          <section className="paper relative flex h-full w-1/2 flex-col rounded-l-[3px] py-12 pl-12 pr-16">
            <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
              <PalettePage />
            </div>
          </section>

          {/* Right page */}
          <section className="paper relative flex h-full w-1/2 flex-col rounded-r-[3px] py-12 pl-16 pr-12">
            <span className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-ink/10 to-transparent" />
            <div key={active} className="animate-fade-in flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
              {rightPage}
            </div>

            {/* Right-edge index tabs */}
            <nav className="absolute right-0 top-16 z-30 flex translate-x-full flex-col gap-2">
              {TABS.map((tab) => {
                const isActive = tab.key === active;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActive(tab.key)}
                    className={`paper flex items-center gap-2 rounded-r-[3px] py-4 pl-2 pr-2.5 shadow-tab transition-all duration-300 [writing-mode:vertical-rl] ${
                      isActive
                        ? 'text-espresso'
                        : 'text-stone hover:text-ash'
                    }`}
                    style={{ marginLeft: isActive ? 0 : '-6px' }}
                  >
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em]">
                      {tab.index}. {tab.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </section>

          {/* Center spine — metallic ring binder */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center justify-center gap-7">
            <span className="absolute inset-y-4 w-px bg-ink/15" />
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="binder-ring relative" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
