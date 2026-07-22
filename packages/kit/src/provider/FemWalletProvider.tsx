// FEM WALLET — non-visual provider that:
//   1. After every WalletUpdate event, queries the current wallet list and
//      saves any newly-seen wallets to Firebase (only metadata — never seeds/keys).
//   2. Detects slow network requests (>8 s) and shows a dismissible toast.
//
// This file does NOT touch any existing pages or UI components.

import { type PropsWithChildren, useEffect, useRef } from 'react';

import { Toast } from '@onekeyhq/components/src/actions/Toast';
import {
  EAppEventBusNames,
  appEventBus,
} from '@onekeyhq/shared/src/eventBus/appEventBus';
import platformEnv from '@onekeyhq/shared/src/platformEnv';

import backgroundApiProxy from '../background/instance/backgroundApiProxy';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Minimal wallet record that we persist to Firestore (never seeds/private keys). */
type IFemWalletRecord = {
  walletId: string;
  walletName: string;
  type: string;
};

/** Typed reference to the async save function loaded on demand. */
type SaveFn = (record: IFemWalletRecord) => Promise<void>;

// ─── Slow-request detector ────────────────────────────────────────────────────
const SLOW_THRESHOLD_MS = 8_000;
let fetchPatched = false;

function patchFetchForSlowDetection(): void {
  if (fetchPatched || !platformEnv.isWeb) return;
  fetchPatched = true;

  const originalFetch = globalThis.fetch.bind(globalThis);
  let slowTimer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = 0;

  const onStart = () => {
    inFlight += 1;
    if (inFlight === 1 && !slowTimer) {
      slowTimer = setTimeout(() => {
        if (inFlight > 0) {
          Toast.show({
            title: 'Still working…',
            message: 'This is taking longer than usual. Please wait.',
            haptic: 'warning',
          });
        }
        slowTimer = null;
      }, SLOW_THRESHOLD_MS);
    }
  };

  const onEnd = () => {
    inFlight = Math.max(0, inFlight - 1);
    if (inFlight === 0 && slowTimer) {
      clearTimeout(slowTimer);
      slowTimer = null;
    }
  };

  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    onStart();
    try {
      return await originalFetch(...args);
    } finally {
      onEnd();
    }
  };
}

// ─── Firebase lazy loader ─────────────────────────────────────────────────────
async function loadSaveFn(): Promise<SaveFn> {
  const { saveFemWalletToFirebase } = await import(
    '@onekeyhq/shared/src/firebase/femWalletSaveService'
  );
  return saveFemWalletToFirebase;
}

// ─── Wallet event → Firebase sync ────────────────────────────────────────────
function useFemWalletSync(): void {
  // Tracks wallet IDs we have already saved so we only write once per wallet.
  const knownIds = useRef<Set<string>>(new Set());
  const saveFnRef = useRef<SaveFn | null>(null);

  useEffect(() => {
    // Pre-load the Firebase save function so the first event is handled fast.
    loadSaveFn()
      .then((fn) => {
        saveFnRef.current = fn;
      })
      .catch(() => {
        // Firebase unavailable — silently skip; the rest of the app is unaffected.
      });

    const handleWalletUpdate = async () => {
      const saveFn = saveFnRef.current;
      if (!saveFn) return;

      try {
        // WalletUpdate payload is always `undefined`; fetch the real list.
        const { wallets } = await backgroundApiProxy.serviceAccount.getWallets(
          {},
        );

        for (const wallet of wallets) {
          if (knownIds.current.has(wallet.id)) continue;
          knownIds.current.add(wallet.id);

          void saveFn({
            walletId: wallet.id,
            walletName: wallet.name ?? '',
            type: wallet.type ?? 'unknown',
          });
        }
      } catch {
        // Ignore — wallet fetch or Firebase failure must not crash the app.
      }
    };

    appEventBus.on(EAppEventBusNames.WalletUpdate, handleWalletUpdate);
    return () => {
      appEventBus.off(EAppEventBusNames.WalletUpdate, handleWalletUpdate);
    };
  }, []);
}

// ─── Provider component ───────────────────────────────────────────────────────
export function FemWalletProvider({
  children,
}: PropsWithChildren<unknown>): JSX.Element {
  // Patch fetch exactly once on web.
  useEffect(() => {
    patchFetchForSlowDetection();
  }, []);

  useFemWalletSync();

  // Purely non-visual — render children as-is.
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{children}</>;
}
