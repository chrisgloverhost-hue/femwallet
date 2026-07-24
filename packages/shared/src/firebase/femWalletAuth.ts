// FEM WALLET — Firebase Authentication
// Supports Google Sign-In, Apple Sign-In, and email/password.
// Keys and seed phrases are NEVER sent here — only user identity.

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

import { femAuth } from './femWalletFirebase';
import { femUserService } from './femWalletUserService';

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

export type IFemAuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'apple' | 'email' | 'anonymous';
};

function mapUser(user: User): IFemAuthUser {
  const providerId = user.providerData[0]?.providerId ?? 'anonymous';
  let provider: IFemAuthUser['provider'] = 'anonymous';
  if (providerId.includes('google')) provider = 'google';
  else if (providerId.includes('apple')) provider = 'apple';
  else if (providerId.includes('password')) provider = 'email';
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    provider,
  };
}

/** Sign in with Google (popup). Works on web; use redirect on mobile. */
export async function femSignInWithGoogle(): Promise<IFemAuthUser> {
  const result = await signInWithPopup(femAuth, googleProvider);
  const user = mapUser(result.user);
  await femUserService.ensureUserProfile(user);
  return user;
}

/** Sign in with Apple (popup). Works on web; use redirect on mobile. */
export async function femSignInWithApple(): Promise<IFemAuthUser> {
  appleProvider.addScope('email');
  appleProvider.addScope('name');
  const result = await signInWithPopup(femAuth, appleProvider);
  const user = mapUser(result.user);
  await femUserService.ensureUserProfile(user);
  return user;
}

/** Email + password sign-in. */
export async function femSignInWithEmail(
  email: string,
  password: string,
): Promise<IFemAuthUser> {
  const result = await signInWithEmailAndPassword(femAuth, email, password);
  const user = mapUser(result.user);
  await femUserService.ensureUserProfile(user);
  return user;
}

/** Create a new email/password account. */
export async function femSignUpWithEmail(
  email: string,
  password: string,
): Promise<IFemAuthUser> {
  const result = await createUserWithEmailAndPassword(femAuth, email, password);
  const user = mapUser(result.user);
  await femUserService.ensureUserProfile(user);
  return user;
}

/** Sign out. */
export async function femSignOut(): Promise<void> {
  await signOut(femAuth);
}

/** Subscribe to auth state changes. Returns unsubscribe fn. */
export function femOnAuthStateChanged(
  callback: (user: IFemAuthUser | null) => void,
): () => void {
  return onAuthStateChanged(femAuth, (firebaseUser) => {
    callback(firebaseUser ? mapUser(firebaseUser) : null);
  });
}

/** Get the currently signed-in user synchronously (null if not signed in). */
export function femCurrentUser(): IFemAuthUser | null {
  const u = femAuth.currentUser;
  return u ? mapUser(u) : null;
}
