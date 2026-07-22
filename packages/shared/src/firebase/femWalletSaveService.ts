// FEM WALLET — Firestore wallet-save service
// Called whenever a wallet is created or imported so the record is persisted
// in the user's Firebase project (collection: "fem_wallets").
// NOTE: Seed phrases and private keys are intentionally NOT saved here —
// only metadata (walletId, name, type, timestamps).  The raw keys remain
// in the on-device encrypted database; sending them to Firebase would be a
// critical security risk.

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { femFirestore } from './femWalletFirebase';

export type IFemWalletRecord = {
  walletId: string;
  walletName?: string;
  /** 'hd' = created from mnemonic, 'imported' = private-key import, 'keyless' = social-login */
  type: 'hd' | 'imported' | 'keyless' | string;
  deviceId?: string;
  source?: string;
};

export async function saveFemWalletToFirebase(
  record: IFemWalletRecord,
): Promise<void> {
  try {
    await addDoc(collection(femFirestore, 'fem_wallets'), {
      ...record,
      savedAt: serverTimestamp(),
    });
    // eslint-disable-next-line no-console
    console.log('[FEM] Wallet record saved to Firebase:', record.walletId);
  } catch (err) {
    // Non-fatal — app continues normally even if Firebase write fails.
    // eslint-disable-next-line no-console
    console.warn('[FEM] Firebase wallet save failed:', err);
  }
}
