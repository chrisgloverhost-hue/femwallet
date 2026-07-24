---
name: FEM Firebase layer
description: Where FEM Wallet's Firebase/hybrid backend code lives and what it does.
---

**Rule:** OneKey backend endpoints are kept 100% unchanged. Firebase is a separate FEM-owned layer on top.

**Files in packages/shared/src/firebase/:**
- `femWalletFirebase.ts` — Firebase app init, exports `femAuth` + `femFirestore`
- `femWalletAuth.ts` — Google/Apple/email sign-in via Firebase Auth
- `femWalletUserService.ts` — Firestore user profiles, linked addresses, watchlist
- `femWalletHybrid.ts` — Custodial deposit/withdrawal recording in Firestore
- `femWalletMarket.ts` — CoinGecko public API fallback (no key needed)
- `femWalletSaveService.ts` — Wallet metadata save on create/import
- `index.ts` — Barrel export for the whole layer

**Firebase project:** fem-wallet-6a6e3
**Android API key:** AIzaSyDSeASTXwK7aA0QzWAnEa0ss2jFQOYAIYE
**iOS API key:** AIzaSyCVCF2uS0d01RsmvjWV2q8j8K3fCE5a-ls
**Web App ID:** not yet registered — user must add a Web App in Firebase console to get the web appId.

**Firestore collections:**
- `fem_users` — profiles, linked addresses, custodial addresses, preferences, watchlist
- `fem_wallets` — wallet metadata (public address only, never keys)
- `fem_custodial_deposits` — deposits into FEM-controlled addresses
- `fem_custodial_withdrawals` — withdrawal requests from FEM-controlled addresses

**Why:** Hybrid model: user keeps private key on device (non-custodial), FEM tracks custodial addresses in Firestore. OneKey backend handles all chain/market/swap data unchanged.
