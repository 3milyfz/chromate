import { useEffect, useState, type FormEvent } from 'react';
import { useAppContext } from '@/context/AppContext';

type AuthMode = 'create' | 'access';

/**
 * State 1: The Tactical Envelope.
 *
 * A physical stationery artifact resting on warm ivory. Unveiling it
 * plays a flap-open animation and dissolves into a pristine paper insert
 * carrying the manifesto and a hyper-minimal auth toggle.
 */
export default function EnvelopeLanding() {
  const { login } = useAppContext();
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<AuthMode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleUnveil() {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => setOpened(true), 820);
  }

  function handleEnter(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    login(email);
  }

  return (
    <main className="canvas-grain relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <p className="caption absolute left-1/2 top-8 -translate-x-1/2 text-stone/80">
        Chromate · Seasonal Color Studio
      </p>

      {!opened ? (
        <Envelope opening={opening} onUnveil={handleUnveil} />
      ) : (
        <Insert
          mode={mode}
          email={email}
          password={password}
          onMode={setMode}
          onEmail={setEmail}
          onPassword={setPassword}
          onSubmit={handleEnter}
        />
      )}
    </main>
  );
}

/* ------------------------------------------------------------------ *
 * The closed envelope
 * ------------------------------------------------------------------ */

function Envelope({
  opening,
  onUnveil,
}: {
  opening: boolean;
  onUnveil: () => void;
}) {
  return (
    <div
      className={`perspective transition-all duration-700 ${
        opening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
      }`}
    >
      <div className="preserve-3d relative aspect-[7/5] w-[min(88vw,560px)]">
        {/* Back panel */}
        <div className="paper absolute inset-0 rounded-[3px] shadow-page" />

        {/* Inner shadow lip */}
        <div className="absolute inset-0 rounded-[3px] shadow-[inset_0_0_40px_rgba(35,32,28,0.06)]" />

        {/* Front pocket (V) */}
        <div
          className="paper absolute inset-0 rounded-[3px] shadow-[inset_0_2px_8px_rgba(35,32,28,0.10)]"
          style={{
            zIndex: 20,
            clipPath: 'polygon(0 38%, 50% 92%, 100% 38%, 100% 100%, 0 100%)',
          }}
        />
        {/* Pocket seam lines */}
        <div
          className="absolute inset-0"
          style={{
            zIndex: 21,
            background:
              'linear-gradient(135deg, transparent calc(50% - 0.5px), rgba(35,32,28,0.10) 50%, transparent calc(50% + 0.5px))',
            clipPath: 'polygon(0 38%, 50% 92%, 0 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            zIndex: 21,
            background:
              'linear-gradient(225deg, transparent calc(50% - 0.5px), rgba(35,32,28,0.10) 50%, transparent calc(50% + 0.5px))',
            clipPath: 'polygon(100% 38%, 50% 92%, 100% 100%)',
          }}
        />

        {/* Top flap (opens) */}
        <div
          className={`absolute left-0 top-0 w-full origin-top ${
            opening ? 'animate-flap-open' : ''
          }`}
          style={{
            height: '64%',
            zIndex: opening ? 5 : 30,
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            background:
              'linear-gradient(180deg, #f7f5f1 0%, #efece6 100%)',
            boxShadow: '0 6px 14px -8px rgba(35,32,28,0.35)',
          }}
        />

        {/* Minimal paperclip */}
        <svg
          className="absolute left-1/2 top-[-14px] z-40 -translate-x-1/2"
          width="26"
          height="74"
          viewBox="0 0 26 74"
          fill="none"
        >
          <path
            d="M13 6 v52 a6.5 6.5 0 0 1 -13 0 v-44 a4 4 0 0 1 8 0 v40"
            transform="translate(6 0)"
            stroke="#8d847a"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>

        {/* Unveil action on the flap */}
        {!opening && (
          <button
            type="button"
            onClick={onUnveil}
            className="btn-line absolute left-1/2 top-[30%] z-40 -translate-x-1/2 whitespace-nowrap"
          >
            Open Your Invite
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The revealed paper insert (manifesto + auth)
 * ------------------------------------------------------------------ */

function Insert({
  mode,
  email,
  password,
  onMode,
  onEmail,
  onPassword,
  onSubmit,
}: {
  mode: AuthMode;
  email: string;
  password: string;
  onMode: (m: AuthMode) => void;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  // Render hidden on first paint, then flip to visible on the next frame so
  // the card always transitions in from its starting state, never popping
  // into view first. A double rAF guarantees the hidden frame is painted
  // before the transition is triggered.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  return (
    <div
      className={`paper w-[min(92vw,620px)] rounded-[3px] px-10 py-14 shadow-page transition-all duration-[800ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] sm:px-16 sm:py-16 ${
        shown
          ? 'translate-y-0 scale-100 opacity-100'
          : 'translate-y-7 scale-[0.98] opacity-0'
      }`}
    >
      <header className="text-center">
        <h1 className="font-serif text-5xl font-light uppercase tracking-editorial text-ink sm:text-6xl">
          Chromate
        </h1>
      </header>

      <div className="mx-auto my-10 h-px w-16 bg-ink/15" />

      <section className="text-center">
        <h2 className="font-serif text-2xl font-light italic leading-snug text-ink sm:text-[28px]">
        Color analysis, applied.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-center text-[13.5px] font-light leading-relaxed text-ash">
          Knowing your season is only the beginning. Chromate bridges the gap between your palette and the real world.
        </p>
      </section>

      <form onSubmit={onSubmit} className="mt-12">
        {/* Auth toggle */}
        <div className="flex items-center justify-center gap-8">
          <ToggleTab
            active={mode === 'create'}
            label="Create File"
            onClick={() => onMode('create')}
          />
          <span className="h-3 w-px bg-ink/20" />
          <ToggleTab
            active={mode === 'access'}
            label="Access File"
            onClick={() => onMode('access')}
          />
        </div>

        <div className="mx-auto mt-9 max-w-sm space-y-7">
          <Field
            label="Email Address"
            type="email"
            value={email}
            onChange={onEmail}
            autoComplete="email"
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={onPassword}
            autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
          />
        </div>

        <div className="mt-12 flex justify-center">
          <button type="submit" className="btn-line">
            [ Enter Archive ]
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-sans text-[11px] uppercase tracking-archive transition-colors duration-300 ${
        active ? 'text-ink' : 'text-stone hover:text-ash'
      }`}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="caption text-stone">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-0 border-b border-ink/15 bg-transparent pb-2 font-sans text-[14px] font-light tracking-wide text-ink outline-none transition-colors duration-300 placeholder:text-stone/60 focus:border-ink/45"
        placeholder=""
      />
    </label>
  );
}
