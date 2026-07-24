// FEM WALLET — Firestore User & Wallet Profile Service
// Stores: user profile, linked wallet addresses, preferences, watchlist.
// Does NOT store: private keys, seed phrases, or any signing material.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { femFirestore } from './femWalletFirebase';
import type { IFemAuthUser } from './femWalletAuth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IFemWalletAddress = {
  address: string;       // public address — safe to store
  networkId: string;     // e.g. 'evm--1', 'btc--0'
  label?: string;
  addedAt?: number;
};

export type IFemUserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: string;
  createdAt?: unknown;   // serverTimestamp
  updatedAt?: unknown;
  // Hybrid wallet fields
  femCustodialAddresses?: IFemWalletAddress[];  // FEM-controlled addresses for this user
  linkedAddresses?: IFemWalletAddress[];        // User's own on-device wallet addresses
  preferences?: IFemUserPreferences;
  watchlist?: string[];  // token IDs
};

export type IFemUserPreferences = {
  currency?: string;      // 'USD', 'EUR', etc.
  theme?: 'dark' | 'light' | 'system';
  language?: string;
  notifications?: boolean;
};

// ─── Hybrid Wallet Record ─────────────────────────────────────────────────────

export type IFemHybridWalletRecord = {
  walletId: string;
  walletName?: string;
  type: 'hd' | 'imported' | 'keyless' | 'hybrid';
  uid: string;
  /** 
   * Custodial portion: FEM controls this address on behalf of the user.
   * Funds sent here are managed by FEM WALLET's infrastructure.
   */
  femCustodialAddress?: string;
  femCustodialNetwork?: string;
  /**
   * Non-custodial portion: user's own address on their device.
   * FEM never has the key for this address.
   */
  userAddress?: string;
  userNetwork?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

// ─── Service ──────────────────────────────────────────────────────────────────

class FemWalletUserService {
  private userCol = 'fem_users';
  private walletCol = 'fem_wallets';

  /** Create user profile doc if it doesn't exist yet. Called on every login. */
  async ensureUserProfile(user: IFemAuthUser): Promise<void> {
    try {
      const ref = doc(femFirestore, this.userCol, user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: user.provider,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          linkedAddresses: [],
          femCustodialAddresses: [],
          watchlist: [],
          preferences: {
            currency: 'USD',
            theme: 'dark',
            notifications: true,
          },
        } satisfies Partial<IFemUserProfile>);
      } else {
        // Update last-seen fields
        await updateDoc(ref, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('[FEM] ensureUserProfile failed:', err);
    }
  }

  /** Get full user profile. */
  async getUserProfile(uid: string): Promise<IFemUserProfile | null> {
    try {
      const snap = await getDoc(doc(femFirestore, this.userCol, uid));
      return snap.exists() ? (snap.data() as IFemUserProfile) : null;
    } catch {
      return null;
    }
  }

  /** Link a user's on-device wallet address to their Firebase profile. */
  async linkUserAddress(uid: string, entry: IFemWalletAddress): Promise<void> {
    try {
      await updateDoc(doc(femFirestore, this.userCol, uid), {
        linkedAddresses: arrayUnion({ ...entry, addedAt: Date.now() }),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[FEM] linkUserAddress failed:', err);
    }
  }

  /** Unlink a user's address from their Firebase profile. */
  async unlinkUserAddress(uid: string, entry: IFemWalletAddress): Promise<void> {
    try {
      await updateDoc(doc(femFirestore, this.userCol, uid), {
        linkedAddresses: arrayRemove(entry),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[FEM] unlinkUserAddress failed:', err);
    }
  }

  /** 
   * Register a FEM custodial address for a user.
   * This is the address FEM WALLET controls on behalf of the user
   * for the custodial side of the hybrid wallet.
   */
  async registerCustodialAddress(
    uid: string,
    entry: IFemWalletAddress,
  ): Promise<void> {
    try {
      await updateDoc(doc(femFirestore, this.userCol, uid), {
        femCustodialAddresses: arrayUnion({ ...entry, addedAt: Date.now() }),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[FEM] registerCustodialAddress failed:', err);
    }
  }

  /** Save a hybrid wallet record (both custodial + non-custodial sides). */
  async saveHybridWallet(record: IFemHybridWalletRecord): Promise<void> {
    try {
      await setDoc(
        doc(femFirestore, this.walletCol, record.walletId),
        {
          ...record,
          createdAt: record.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );
    } catch (err) {
      console.warn('[FEM] saveHybridWallet failed:', err);
    }
  }

  /** Get all hybrid wallets for a user. */
  async getUserWallets(uid: string): Promise<IFemHybridWalletRecord[]> {
    try {
      const q = query(
        collection(femFirestore, this.walletCol),
        where('uid', '==', uid),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as IFemHybridWalletRecord);
    } catch {
      return [];
    }
  }

  /** Update user preferences. */
  async updatePreferences(
    uid: string,
    prefs: Partial<IFemUserPreferences>,
  ): Promise<void> {
    try {
      const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
      for (const [k, v] of Object.entries(prefs)) {
        updates[`preferences.${k}`] = v;
      }
      await updateDoc(doc(femFirestore, this.userCol, uid), updates);
    } catch (err) {
      console.warn('[FEM] updatePreferences failed:', err);
    }
  }

  /** Add a token to the user's watchlist. */
  async addToWatchlist(uid: string, tokenId: string): Promise<void> {
    try {
      await updateDoc(doc(femFirestore, this.userCol, uid), {
        watchlist: arrayUnion(tokenId),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[FEM] addToWatchlist failed:', err);
    }
  }

  /** Remove a token from the user's watchlist. */
  async removeFromWatchlist(uid: string, tokenId: string): Promise<void> {
    try {
      await updateDoc(doc(femFirestore, this.userCol, uid), {
        watchlist: arrayRemove(tokenId),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[FEM] removeFromWatchlist failed:', err);
    }
  }
}

export const femUserService = new FemWalletUserService();
