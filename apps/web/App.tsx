import { Suspense, lazy, useEffect } from 'react';

import '@onekeyhq/components/src/hocs/Provider/web-fonts.css';
import { KitProvider } from '@onekeyhq/kit';
import { debugLandingLog } from '@onekeyhq/shared/src/performance/init';
import '@onekeyhq/shared/src/web/index.css';

// cspell:ignore Agentation
const AgentationDev =
  process.env.NODE_ENV !== 'production'
    ? lazy(() => import('agentation').then((m) => ({ default: m.Agentation })))
    : () => null;

/** Remove the FEM WALLET HTML splash screen once React has mounted. */
function useDismissFemSplash() {
  useEffect(() => {
    const el = document.getElementById('fem-splash');
    if (!el) return;
    // Give React one paint cycle then fade out.
    requestAnimationFrame(() => {
      el.style.opacity = '0';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
      // Safety: remove even if transitionend never fires.
      setTimeout(() => el.remove(), 800);
    });
  }, []);
}

export default function App(props: any) {
  if (process.env.NODE_ENV !== 'production') {
    debugLandingLog('App render');
  }

  useDismissFemSplash();

  return (
    <>
      <KitProvider {...props} />
      {process.env.NODE_ENV !== 'production' ? (
        <Suspense>
          <AgentationDev endpoint="http://localhost:4747" />
        </Suspense>
      ) : null}
    </>
  );
}
