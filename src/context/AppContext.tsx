/**
 * Chromate — The Personal Canvas Context
 * ------------------------------------------------------------------
 * The application's global memory. It holds the user's analyzed season,
 * their curated roster of luxury houses, and their virtual closet of
 * scanned garments — and it transparently persists every mutation to
 * `localStorage` so the experience resumes, flawless, on reload.
 *
 * Consumers should reach for the `useAppContext` hook rather than the
 * raw context object; it guards against use outside the provider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { HSL } from '@/types/color';

/* ------------------------------------------------------------------ *
 * State shape
 * ------------------------------------------------------------------ */

/**
 * A single garment or product the user has captured into their closet.
 * Each item records both the human-friendly source (image) and the
 * machine-extracted color science used to score it against the season.
 */
export interface VirtualClosetItem {
  /** Stable unique identifier for the captured item. */
  id: string;
  /** Source image (object URL, data URL, or remote URL). */
  imageUrl: string;
  /** The dominant color extracted from the image, as hex. */
  extractedHex: string;
  /** The same dominant color expressed in HSL coordinates. */
  extractedHsl: HSL;
  /** Harmony score against the user's current season, `0 – 100`. */
  matchScore: number;
  /** ISO-8601 timestamp of capture, e.g. `2026-06-07T18:42:00.000Z`. */
  capturedAt: string;
}

/**
 * A mock authenticated session. Chromate's auth is intentionally a
 * façade for the prototype — enough to gate the dossier and persist
 * across reloads, without any real credential handling.
 */
export interface UserSession {
  /** The email the file was created/accessed under. */
  email: string;
  /** ISO-8601 timestamp of when the archive was opened. */
  openedAt: string;
}

/** The complete, serializable global state of Chromate. */
export interface AppState {
  /** The active mock session, or `null` when the archive is sealed. */
  session: UserSession | null;
  /** The season id currently in focus in the dossier, or `null` before analysis. */
  currentSeason: string | null;
  /**
   * The user's confirmed "best" seasons (one or more), by id, captured
   * during onboarding. `currentSeason` is, by convention, the first of these.
   */
  seasons: string[];
  /** Preferred luxury / minimalist houses, by name. */
  favoriteBrands: string[];
  /** Every garment the user has scanned into their canvas. */
  virtualCloset: VirtualClosetItem[];
}

/* ------------------------------------------------------------------ *
 * Defaults & persistence
 * ------------------------------------------------------------------ */

/**
 * Initial state. `currentSeason` is deliberately `null` so that a freshly
 * authenticated user is routed through the seasonal onboarding (State 2)
 * before the dossier is ever compiled. Once a season is confirmed there,
 * it persists and the onboarding is skipped on subsequent sessions.
 */
const DEFAULT_STATE: AppState = {
  session: null,
  currentSeason: null,
  seasons: [],
  favoriteBrands: ['Merit', 'The Row', 'Jil Sander', 'LEMAIRE'],
  virtualCloset: [],
};

/** The `localStorage` key under which the canvas is persisted. */
const STORAGE_KEY = 'chromate:canvas-state:v1';

/** Reads and validates persisted state, falling back to defaults. */
function loadState(): AppState {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const parsed = JSON.parse(raw) as Partial<AppState>;

    const rawCurrent =
      parsed.currentSeason === null || typeof parsed.currentSeason === 'string'
        ? parsed.currentSeason ?? null
        : DEFAULT_STATE.currentSeason;

    // `seasons` is newer than `currentSeason`; if it is absent, derive it
    // from the legacy single-season field so older sessions still resolve.
    const seasons = Array.isArray(parsed.seasons)
      ? parsed.seasons.filter((s): s is string => typeof s === 'string')
      : rawCurrent
        ? [rawCurrent]
        : DEFAULT_STATE.seasons;

    // The active/primary season drives the single-season editorial pages.
    // Keep it coherent with the confirmed set: fall back to the first
    // selected season when the stored primary is missing or stale.
    const currentSeason =
      rawCurrent && seasons.includes(rawCurrent)
        ? rawCurrent
        : seasons.length > 0
          ? seasons[0]
          : null;

    // Merge defensively: a stored shape may predate newer fields.
    return {
      session:
        parsed.session && typeof parsed.session.email === 'string'
          ? {
              email: parsed.session.email,
              openedAt: parsed.session.openedAt ?? new Date().toISOString(),
            }
          : DEFAULT_STATE.session,
      currentSeason,
      seasons,
      favoriteBrands: Array.isArray(parsed.favoriteBrands)
        ? parsed.favoriteBrands
        : DEFAULT_STATE.favoriteBrands,
      virtualCloset: Array.isArray(parsed.virtualCloset)
        ? parsed.virtualCloset
        : DEFAULT_STATE.virtualCloset,
    };
  } catch {
    // Corrupt or unreadable storage should never break the app.
    return DEFAULT_STATE;
  }
}

/* ------------------------------------------------------------------ *
 * Context value
 * ------------------------------------------------------------------ */

/** The public API exposed to every consumer of the canvas context. */
export interface AppContextValue extends AppState {
  /** Convenience flag — true when a session is open. */
  isAuthenticated: boolean;
  /** Open the archive under an email (mock sign-up / login). */
  login: (email: string) => void;
  /** Seal the archive and clear the session. */
  logout: () => void;

  /** Set (or clear, with `null`) the user's analyzed season. */
  setCurrentSeason: (seasonId: string | null) => void;

  /** Replace the user's confirmed set of best seasons. */
  setSeasons: (seasonIds: string[]) => void;

  /** Add a luxury house to favorites (no-op if already present). */
  addFavoriteBrand: (brand: string) => void;
  /** Remove a luxury house from favorites. */
  removeFavoriteBrand: (brand: string) => void;
  /** Replace the entire favorites roster. */
  setFavoriteBrands: (brands: string[]) => void;

  /** Capture a new item into the virtual closet (id/date auto-filled). */
  addClosetItem: (
    item: Omit<VirtualClosetItem, 'id' | 'capturedAt'> &
      Partial<Pick<VirtualClosetItem, 'id' | 'capturedAt'>>,
  ) => VirtualClosetItem;
  /** Remove a captured item by id. */
  removeClosetItem: (id: string) => void;
  /** Empty the virtual closet entirely. */
  clearCloset: () => void;

  /** Reset the entire canvas back to its default state. */
  resetCanvas: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/* ------------------------------------------------------------------ *
 * Utilities
 * ------------------------------------------------------------------ */

/** Generates a collision-resistant id, with a graceful fallback. */
function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `item_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/* ------------------------------------------------------------------ *
 * Provider
 * ------------------------------------------------------------------ */

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Wraps the application and supplies the persistent global canvas state.
 * Every state change is written back to `localStorage` on the next tick.
 */
export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>(loadState);

  // Persist on every change. The first run is skipped to avoid an
  // immediate redundant write of freshly-loaded state.
  const isHydrating = useRef(true);
  useEffect(() => {
    if (isHydrating.current) {
      isHydrating.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or unavailable (private mode); fail silently.
    }
  }, [state]);

  const login = useCallback((email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      session: { email: trimmed, openedAt: new Date().toISOString() },
    }));
  }, []);

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, session: null }));
  }, []);

  const setCurrentSeason = useCallback((seasonId: string | null) => {
    setState((prev) => ({ ...prev, currentSeason: seasonId }));
  }, []);

  const setSeasons = useCallback((seasonIds: string[]) => {
    setState((prev) => ({ ...prev, seasons: seasonIds }));
  }, []);

  const addFavoriteBrand = useCallback((brand: string) => {
    const trimmed = brand.trim();
    if (!trimmed) return;
    setState((prev) =>
      prev.favoriteBrands.includes(trimmed)
        ? prev
        : { ...prev, favoriteBrands: [...prev.favoriteBrands, trimmed] },
    );
  }, []);

  const removeFavoriteBrand = useCallback((brand: string) => {
    setState((prev) => ({
      ...prev,
      favoriteBrands: prev.favoriteBrands.filter((b) => b !== brand),
    }));
  }, []);

  const setFavoriteBrands = useCallback((brands: string[]) => {
    setState((prev) => ({ ...prev, favoriteBrands: brands }));
  }, []);

  const addClosetItem = useCallback<AppContextValue['addClosetItem']>(
    (item) => {
      const fullItem: VirtualClosetItem = {
        ...item,
        id: item.id ?? createId(),
        capturedAt: item.capturedAt ?? new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        virtualCloset: [fullItem, ...prev.virtualCloset],
      }));
      return fullItem;
    },
    [],
  );

  const removeClosetItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      virtualCloset: prev.virtualCloset.filter((item) => item.id !== id),
    }));
  }, []);

  const clearCloset = useCallback(() => {
    setState((prev) => ({ ...prev, virtualCloset: [] }));
  }, []);

  const resetCanvas = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      isAuthenticated: state.session !== null,
      login,
      logout,
      setCurrentSeason,
      setSeasons,
      addFavoriteBrand,
      removeFavoriteBrand,
      setFavoriteBrands,
      addClosetItem,
      removeClosetItem,
      clearCloset,
      resetCanvas,
    }),
    [
      state,
      login,
      logout,
      setCurrentSeason,
      setSeasons,
      addFavoriteBrand,
      removeFavoriteBrand,
      setFavoriteBrands,
      addClosetItem,
      removeClosetItem,
      clearCloset,
      resetCanvas,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

/**
 * Access the persistent global canvas state.
 * Throws if used outside of `<AppProvider>` so misuse fails loudly.
 */
export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === undefined) {
    throw new Error('useAppContext must be used within an <AppProvider>.');
  }
  return ctx;
}
