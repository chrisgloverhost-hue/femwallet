// FEM WALLET — Firestore wallet-save service
// Called when a wallet is created or imported so the record is persisted.
// NOTE: Seed phrases and private keys are intentionally NOT saved here —
// only metadata (walletId, name, type, timestamps, public addresses).

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { femFirestore } from './femWalletFirebase';

export type IFemWalletRecord = {
  walletId: string;
  walletName?: string;
  /** 'hd' = created from mnemonic, 'imported' = private-key import, 'keyless' = social-login, 'hybrid' = FEM hybrid */
  type: 'hd' | 'imported' | 'keyless' | 'hybrid' | string;
  deviceId?: string;
  source?: string;
  /** Public address only — never the private key */
  publicAddress?: string;
  networkId?: string;
  uid?: string; // Firebase user UID if signed in
};

export async function saveFemWalletToFirebase(
  record: IFemWalletRecord,
): Promise<void> {
  try {
    await addDoc(collection(femFirestore, 'fem_wallets'), {
      ...record,
      savedAt: serverTimestamp(),
    });
    console.log('[FEM] Wallet record saved to Firebase:', record.walletId);
  } catch (err) {
    // Non-fatal — app continues normally even if Firebase write fails.
    console.warn('[FEM] Firebase wallet save failed:', err);
  }
}
