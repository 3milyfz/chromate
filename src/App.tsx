import { useAppContext } from '@/context/AppContext';
import EnvelopeLanding from '@/components/EnvelopeLanding';
import SeasonOnboarding from '@/components/SeasonOnboarding';
import Dossier from '@/components/Dossier';
import DevReset from '@/components/DevReset';

/**
 * App shell. Routes between the three sequential states of Chromate:
 *   • State 1, the auth gate (sealed archive)
 *   • State 2, the seasonal onboarding, shown after login while no season
 *               has been confirmed (a blank, immersive selection canvas)
 *   • State 3, the compiled two-page dossier, revealed only once a season
 *               has been chosen
 *
 * The dossier stays fully unmounted until onboarding finalizes, so the
 * progression reads as one clean, sequential flow.
 */
export default function App() {
  const { isAuthenticated, seasons } = useAppContext();

  return (
    <>
      {!isAuthenticated ? (
        <EnvelopeLanding />
      ) : seasons.length === 0 ? (
        <SeasonOnboarding />
      ) : (
        <Dossier />
      )}
      <DevReset />
    </>
  );
}
