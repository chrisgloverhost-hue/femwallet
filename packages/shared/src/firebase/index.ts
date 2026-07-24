// FEM WALLET — Firebase layer public exports

export { default as femFirebaseApp, femFirestore, femAuth } from './femWalletFirebase';

export {
  femSignInWithGoogle,
  femSignInWithApple,
  femSignInWithEmail,
  femSignUpWithEmail,
  femSignOut,
  femOnAuthStateChanged,
  femCurrentUser,
} from './femWalletAuth';

export { femUserService } from './femWalletUserService';
export type {
  IFemAuthUser,
} from './femWalletAuth';
export type {
  IFemUserProfile,
  IFemUserPreferences,
  IFemWalletAddress,
  IFemHybridWalletRecord,
} from './femWalletUserService';

export { femHybridWallet } from './femWalletHybrid';
export type {
  IFemCustodialDeposit,
  IFemCustodialWithdraw,
} from './femWalletHybrid';

export {
  fetchTopCoins,
  fetchSimplePrice,
  fetchCoinChart,
  searchCoins,
  fetchExchangeRates,
} from './femWalletMarket';

export { saveFemWalletToFirebase } from './femWalletSaveService';
