// FEM WALLET — Hybrid Wallet Service
//
// Architecture:
//   Non-custodial side → user's private key on their device (OneKey flow, unchanged)
//   Custodial side     → FEM controls a wallet address on behalf of the user
//
// OneKey's entire backend (RPC, market data, portfolio, swap, etc.) is used
// as-is. FEM WALLET sits on top to:
//   1. Authenticate users via Firebase
//   2. Track which addresses belong to which user
//   3. Manage FEM's custodial addresses per user
//   4. Record all hybrid wallet activity in Firestore
//
// FEM never stores private keys. The custodial side works via FEM's own
// hot wallet infrastructure (server-side, separate from this client code).

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
} from 'firebase/firestore';

import { femFirestore } from './femWalletFirebase';
import { femUserService } from './femWalletUserService';
import type { IFemWalletAddress } from './femWalletUserService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IFemCustodialDeposit = {
  uid: string;
  fromAddress: string;         // user's address (they sent from here)
  toCustodialAddress: string;  // FEM's address (received here)
  networkId: string;
  txHash: string;
  amountRaw: string;
  tokenAddress?: string;       // null = native coin
  status: 'pending' | 'confirmed' | 'failed';
  createdAt?: unknown;
  confirmedAt?: unknown;
};

export type IFemCustodialWithdraw = {
  uid: string;
  fromCustodialAddress: string; // FEM's address
  toUserAddress: string;        // user's target address
  networkId: string;
  txHash?: string;
  amountRaw: string;
  tokenAddress?: string;
  status: 'queued' | 'processing' | 'sent' | 'failed';
  requestedAt?: unknown;
  sentAt?: unknown;
};

// ─── Hybrid Wallet Service ────────────────────────────────────────────────────

class FemHybridWalletService {
  private depositCol = 'fem_custodial_deposits';
  private withdrawCol = 'fem_custodial_withdrawals';

  /**
   * Register a user's wallet with FEM's hybrid system.
   * Call this when a user creates or imports a wallet.
   * Links their on-device address to their Firebase UID.
   * 
   * @param uid        Firebase user UID
   * @param address    User's public address (safe to store)
   * @param networkId  e.g. 'evm--1' for Ethereum mainnet
   */
  async registerUserWallet(
    uid: string,
    address: string,
    networkId: string,
    label?: string,
  ): Promise<void> {
    const entry: IFemWalletAddress = { address, networkId, label };
    await femUserService.linkUserAddress(uid, entry);
  }

  /**
   * Assign a FEM custodial address to a user on a given network.
   * In production, FEM's server generates this address.
   * This client method just records the assignment in Firestore.
   *
   * @param uid              Firebase user UID
   * @param custodialAddress FEM-controlled address for this user
   * @param networkId        Which network this address is on
   */
  async assignCustodialAddress(
    uid: string,
    custodialAddress: string,
    networkId: string,
  ): Promise<void> {
    await femUserService.registerCustodialAddress(uid, {
      address: custodialAddress,
      networkId,
      label: 'FEM Custodial',
    });
  }

  /**
   * Record a user deposit into FEM's custodial address.
   * Called when a deposit tx is detected on-chain.
   */
  async recordDeposit(deposit: Omit<IFemCustodialDeposit, 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(femFirestore, this.depositCol), {
      ...deposit,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Update deposit status (e.g. pending → confirmed). */
  async updateDepositStatus(
    depositId: string,
    status: IFemCustodialDeposit['status'],
  ): Promise<void> {
    await updateDoc(doc(femFirestore, this.depositCol, depositId), {
      status,
      ...(status === 'confirmed' ? { confirmedAt: serverTimestamp() } : {}),
    });
  }

  /**
   * Request a custodial withdrawal.
   * FEM's server processes the queue and sends the tx.
   */
  async requestWithdrawal(
    withdraw: Omit<IFemCustodialWithdraw, 'requestedAt'>,
  ): Promise<string> {
    const ref = await addDoc(collection(femFirestore, this.withdrawCol), {
      ...withdraw,
      status: 'queued',
      requestedAt: serverTimestamp(),
    });
    return ref.id;
  }

  /** Get all custodial deposits for a user. */
  async getUserDeposits(uid: string, maxResults = 50): Promise<IFemCustodialDeposit[]> {
    const q = query(
      collection(femFirestore, this.depositCol),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as IFemCustodialDeposit);
  }

  /** Get all pending withdrawals for a user. */
  async getUserWithdrawals(uid: string, maxResults = 50): Promise<IFemCustodialWithdraw[]> {
    const q = query(
      collection(femFirestore, this.withdrawCol),
      where('uid', '==', uid),
      orderBy('requestedAt', 'desc'),
      limit(maxResults),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as IFemCustodialWithdraw);
  }
}

export const femHybridWallet = new FemHybridWalletService();
