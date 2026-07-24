# FEM WALLET — Backend Architecture

## Decision: Hybrid Backend Model

**OneKey backend is used as-is** — it provides all blockchain infrastructure:
RPC proxying, portfolio data, market prices, swaps, DeFi, NFTs, gas estimation,
chainlists, firmware updates, and more. FEM Wallet does not replicate any of this.

**Firebase is FEM's own layer on top** — it handles:
- User identity (Google / Apple sign-in via Firebase Auth)
- User profiles, linked wallet addresses, preferences (Firestore)
- Hybrid custodial wallet tracking (deposits/withdrawals FEM controls)
- Push notifications (FCM)
- Market data fallback (CoinGecko public API — no key required)

**Hybrid wallet model:**
- Non-custodial side → user's private key stays on their device (unchanged OneKey flow)
- Custodial side → FEM controls a wallet address per user; deposits/withdrawals tracked in Firestore

### Firebase Files (already in codebase)
| File | Purpose |
|---|---|
| `packages/shared/src/firebase/femWalletFirebase.ts` | Firebase app init (Auth + Firestore) |
| `packages/shared/src/firebase/femWalletAuth.ts` | Google / Apple / email sign-in |
| `packages/shared/src/firebase/femWalletUserService.ts` | User profiles, linked addresses, watchlist |
| `packages/shared/src/firebase/femWalletHybrid.ts` | Custodial deposit/withdrawal recording |
| `packages/shared/src/firebase/femWalletMarket.ts` | CoinGecko public API fallback |
| `packages/shared/src/firebase/femWalletSaveService.ts` | Wallet metadata save on create/import |
| `packages/shared/src/firebase/index.ts` | Barrel export |

### Firestore Collections
| Collection | What's stored |
|---|---|
| `fem_users` | Profile, linked addresses, custodial addresses, preferences, watchlist |
| `fem_wallets` | Wallet metadata (type, name, public address — no keys) |
| `fem_custodial_deposits` | Deposits into FEM-controlled addresses |
| `fem_custodial_withdrawals` | Withdrawal requests from FEM-controlled addresses |

---

> The rest of this document is the complete endpoint audit of OneKey's backend
> for reference — all of these endpoints continue to work for FEM Wallet unchanged.

---

# Complete OneKey Backend Feature Audit

> Full reverse-engineering of every OneKey backend endpoint, service, and infrastructure component.  
> Firebase feasibility is assessed for each area.

---

## Quick Summary

| Service | # Endpoints | Firebase Can Cover? | Priority for FEM |
|---|---|---|---|
| `wallet` | 33 | ❌ No — needs blockchain indexer | 🔴 Critical |
| `swap` | 25 | ❌ No — needs DEX aggregator | 🟡 High |
| `utility` (market) | 22 | ❌ No — needs price data provider | 🔴 Critical |
| `utility` (discovery) | 4 | ✅ Yes — Firestore | 🟡 High |
| `utility` (app infra) | 12 | ✅ Yes — Remote Config + Storage | 🟡 High |
| `earn` | 24 | ❌ No — needs DeFi protocol SDKs | 🟢 Later |
| `notification` | 9 + WebSocket | ✅ Yes — FCM + Firestore | 🟡 High |
| `prime` (auth) | 8 | ✅ Yes — Firebase Auth | 🔴 Critical |
| `prime` (keyless wallet) | 10 | ✅ Yes — Firebase Auth + Cloud Functions | 🟢 Later |
| `prime` (KYT/risk) | 5 | ❌ No — needs compliance vendor | 🟢 Later |
| `prime` (cloud sync) | 3 | ✅ Yes — Firestore | 🟢 Later |
| `rebate` | 9 | ✅ Yes — Firestore + Cloud Functions | 🟢 Later |
| `transfer` (E2EE P2P) | bridge | ✅ Partial — Firebase + E2EE layer | 🟢 Later |
| `lightning` | SDK-based | ❌ No — Breez SDK / LND | 🟢 Later |
| Infrastructure (analytics, crash, infra) | — | ✅ Yes — Firebase Analytics + Crashlytics | 🟡 High |
| **TOTAL** | **~164 endpoints** | **~40% Firebase-coverable** | |

---

## 1. WALLET Service — `wallet.onekeycn.com`

The core data service. Powers portfolio, balances, tokens, NFTs, history, hardware, gas, and RPC proxying.

### All Endpoints

**Networks & Configuration**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/health` | GET | Health check (also stops offline banner) | ❌ |
| `/wallet/v1/network/chainlist` | GET | Full list of all supported chains + RPC configs | ❌ |
| `/wallet/v1/network/list` | GET | Simplified network list (EVM only flag) | ❌ |
| `/wallet/v1/network/raw-transaction/list` | POST | Fetch raw signed txs by hash list | ❌ |
| `/wallet/v1/network/explorer-check/:id` | GET | Validate block explorer link | ❌ |
| `/wallet/v1/wallet/config` | GET | Per-wallet feature flags and config | ❌ |

**Portfolio & Balances**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/portfolio/positions` | POST | DeFi positions for an account | ❌ |
| `/wallet/v1/portfolio/chains` | GET | Which chains have DeFi/balance data | ❌ |
| `/wallet/v1/account/token/search-batch` | POST | Batch token lookup by contract address | ❌ |

**Transactions & Send**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/account/send-transaction` | POST | Broadcast signed tx to chain | ❌ |
| `/wallet/v1/account/pre-send-transaction` | POST | Pre-flight validation before broadcast | ❌ |
| `/wallet/v1/account/parse-transaction` | POST | Human-readable transaction decoding | ❌ |
| `/wallet/v1/account/parse-signature` | POST | Human-readable message/signature decoding | ❌ |
| `/wallet/v1/account/estimate-fee-batch` | POST | Batch gas fee estimation across chains | ❌ |
| `/wallet/v1/account/history/list` | POST | Transaction history for an account | ❌ |
| `/wallet/v1/account/transfer-recipient` | GET | Recent transfer recipients | ❌ |

**Account & Identity**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/account/badges` | GET | Account risk/badges (scam check, CEX tag) | ❌ |
| `/wallet/v1/account/validate-address` | GET | Validate a single address | ❌ |
| `/wallet/v1/account/validate-address-batch` | POST | Validate addresses across multiple chains | ❌ |
| `/wallet/v1/account/resolve-name` | GET | Resolve ENS / domain names to address | ❌ |
| `/wallet/v1/account/token-approval/list` | POST | Token allowance/approval list | ❌ |

**NFTs**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/account/nft/list` | GET | NFT items for an account | ❌ |
| `/wallet/v1/account/nft/detail` | POST | NFT metadata + ownership detail | ❌ |

**RPC Proxies**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/proxy/wallet` | POST | Proxy: JSON-RPC to chain node | ❌ |
| `/wallet/v1/proxy/trxres` | POST | Proxy: Tron resource bandwidth/energy | ❌ |
| `/wallet/v1/proxy/network` | POST | Generic DApp RPC proxy | ❌ |
| `/wallet/v1/proxy/hyperliquid/perpsAsset` | POST | Proxy: Hyperliquid perps asset data | ❌ |

**Hardware & Logging**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/hardware/verify` | POST | Verify hardware device authenticity | ❌ |
| `/wallet/v1/client/log/token` | POST | Get upload token for device logs | ⚠️ Firebase Storage |

**Fiat & Exchange**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/wallet/v1/fiat-pay/list` | GET | List of fiat on-ramp providers (MoonPay, etc.) | ❌ |
| `/wallet/v1/fiat-pay/url` | GET | Generate fiat provider checkout URL | ❌ |
| `/wallet/v1/exchange/binance/supported-assets` | GET | Binance Connect supported assets | ❌ |
| `/wallet/v1/exchange/binance/pre-order` | POST | Binance Connect pre-order creation | ❌ |

### How to Build for FEM Wallet

**Portfolio/Balances:** Use [Moralis](https://moralis.io), [Alchemy](https://alchemy.com), [Covalent](https://www.covalenthq.com), or [QuickNode](https://www.quicknode.com) as your indexer. These provide multi-chain token balances via one API.

**Transaction History:** Same indexers above (Alchemy/Moralis have history APIs). For cheap chains, use their native RPCs directly.

**NFTs:** Alchemy NFT API or Moralis NFT API.

**RPC Proxy:** Run your own JSON-RPC proxy to hide provider API keys and rate-limit by user.

**Gas Estimation:** Call chain RPC directly (`eth_estimateGas`, `eth_gasPrice`) — no custom backend needed. Or use Blocknative/Alchemy Gas API.

**Chain List:** Host a static JSON file (or Firestore document) with chain configs. Use [ChainList](https://chainlist.org) data as a starting point.

**Hardware Verify:** Requires OneKey hardware SDK — this is specific to their devices; skip unless FEM will support the same hardware.

**Fiat On-Ramp:** Use [MoonPay](https://moonpay.com), [Transak](https://transak.com), or [Ramp](https://ramp.network) directly — they provide their own widget/URL generation.

---

## 2. SWAP Service — `swap.onekeycn.com`

Handles cross-chain and single-chain swaps including quoting, tx building, and order tracking.

### All Endpoints

**Discovery & Config**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/swap/v1/networks` | GET | Supported swap networks | ❌ |
| `/swap/v1/tokens` | GET | Token list for a network | ❌ |
| `/swap/v1/token/detail` | GET | Single token detail with price | ❌ |
| `/swap/v1/popular/tokens` | GET | Popular/trending swap tokens | ❌ |
| `/swap/v1/providers/list` | GET | List of swap liquidity providers | ❌ |
| `/swap/v1/native-token-config` | GET | Gas reservation config per network | ❌ |
| `/swap/v1/swap-config` | GET | Global config (MEV networks, etc.) | ❌ |
| `/swap/v1/speed-config` | GET | Speed swap configuration per network | ❌ |
| `/swap/v1/check-support` | GET | Check if network supports swap | ❌ |
| `/swap/v1/check-stable-coins-list` | POST | Identify stablecoins in a token list | ❌ |
| `/swap/v1/check/us-market-status` | GET | US stock market open/closed status | ❌ |
| `/swap/v1/check/speed` | GET | Speed swap availability check | ❌ |

**Quoting**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/swap/v1/quote/events` | GET | Real-time quote stream (SSE) | ❌ |
| `/swap/v1/quote/speed` | GET | Speed swap quote (single request) | ❌ |
| `/swap/v1/quote-market/speed` | GET | Market-based speed swap quote | ❌ |

**Transaction Building & Tracking**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/swap/v1/build-tx` | POST | Build swap transaction | ❌ |
| `/swap/v1/build-tx/speed` | POST | Build optimised speed swap tx | ❌ |
| `/swap/v1/state-tx` | POST | Poll swap transaction status | ❌ |
| `/swap/v1/order-detail` | GET | Private swap order details | ❌ |
| `/swap/v1/allowance` | GET | Check token allowance for swap spender | ❌ |

**Limit Orders**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/swap/v1/limit-orders` | POST | Fetch active limit orders for accounts | ❌ |
| `/swap/v1/cancel-limit-orders` | POST | Cancel active limit orders | ❌ |

**Perpetuals Deposit**

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/swap/v1/perp-deposit-quote` | POST | Quote for depositing into perp exchange | ❌ |
| `/swap/v1/perp-deposit-order-status` | GET | Perp deposit order status tracking | ❌ |

### How to Build for FEM Wallet

Integrate a swap aggregator — these do all the heavy lifting:
- **[LI.FI](https://li.fi)** — best multi-chain swap + bridge aggregator (free tier available)
- **[1inch API](https://portal.1inch.dev)** — single-chain, best rates
- **[Socket (Bungee)](https://socket.tech)** — cross-chain bridging  
- **[0x API](https://0x.org)** — professional grade, good for EVM

These aggregators provide: network list, token list, quote, build-tx, and order status — covering the full swap API surface.

---

## 3. UTILITY Service — `utility.onekeycn.com`

Split into three areas: market data, DApp discovery, and app infrastructure.

### Market Data Endpoints

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/utility/v1/market/category/list` | GET | Token categories (DeFi, L2, etc.) | ❌ |
| `/utility/v1/market/tokens` | GET | Token prices list (v1) | ❌ |
| `/utility/v1/market/detail` | GET | Token detail + stats | ❌ |
| `/utility/v1/market/pools` | GET | Liquidity pool data | ❌ |
| `/utility/v1/market/search` | GET | Token search | ❌ |
| `/utility/v1/market/token/chart` | GET | Price chart data | ❌ |
| `/utility/v1/market/token/top-liquidity` | GET | Top liquidity providers | ❌ |
| `/utility/v2/market/trending` | GET | Trending tokens | ❌ |
| `/utility/v2/market/search` | GET | Token search (v2) | ❌ |
| `/utility/v2/market/token/list` | GET | Full token list | ❌ |
| `/utility/v2/market/token/list/batch` | POST | Batch token price fetch | ❌ |
| `/utility/v2/market/token/detail` | GET | Token detail (v2) | ❌ |
| `/utility/v2/market/chains` | GET | Chain config for market | ❌ |
| `/utility/v2/market/basic-config` | GET | Market global config | ❌ |
| `/utility/v2/market/token/kline` | GET | OHLCV candlestick data | ❌ |
| `/utility/v3/market/token/transactions` | GET | Token on-chain transactions | ❌ |
| `/utility/v2/market/account/token/transactions` | GET | Account token activity | ❌ |
| `/utility/v2/market/token/top-holders` | GET | Token top holders | ❌ |
| `/utility/v2/market/token/security/batch` | POST | Token security audit (rug check) | ❌ |
| `/utility/v2/market/banner/list` | GET | Market section banners | ⚠️ Firestore |
| `/utility/v2/market/perps/token-list` | GET | Perpetuals token list | ❌ |
| `/utility/v2/market/account/portfolio` | GET | Account portfolio value | ❌ |

**How to build:** Use [CoinGecko API](https://www.coingecko.com/api) or [CoinMarketCap API](https://coinmarketcap.com/api/) for prices, categories, trending. Use [GeckoTerminal](https://www.geckoterminal.com/api) for pool/DEX data. Use [GoPlus Security API](https://gopluslabs.io) for token security checks. For charts/klines, CoinGecko Pro has OHLCV data.

### DApp Discovery Endpoints

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/utility/v1/discover/dapp/homepage` | GET | Featured DApps on discovery home | ✅ Firestore |
| `/utility/v1/discover/dapp/search` | GET | DApp search | ✅ Firestore |
| `/utility/v1/discover/category/list` | GET | DApp category list | ✅ Firestore |
| `/utility/v1/discover/dapp/list` | GET | DApps by category | ✅ Firestore |

**Firebase plan:** Store the DApp catalog in Firestore. Admin updates via Firebase console. Real-time sync means no deploy needed to update featured DApps.

### App Infrastructure Endpoints

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/utility/v1/app-update` | GET | Check for app update | ✅ Firebase Remote Config |
| `/utility/v1/app-update/bundles` | GET | OTA JS bundle list | ⚠️ Firebase Storage |
| `/utility/v1/app-update/bundle-versions` | GET | OTA bundle version manifest | ⚠️ Firebase Storage |
| `/utility/v1/app-update/version-info` | GET | Version metadata | ✅ Firebase Remote Config |
| `/utility/v1/setting` | GET/POST | Global feature flags/settings | ✅ Firebase Remote Config |
| `/utility/v1/currency/exchange-rates/map` | GET | Fiat exchange rates | ⚠️ Cloud Function + ECB/Fixer |
| `/utility/v1/swap-tips` | GET | Swap UI tip messages | ✅ Firestore |
| `/utility/v1/wallet-banner/list` | GET | Home screen promotional banners | ✅ Firestore |
| `/utility/v1/wallet-homescreen/list` | GET | Hardware device wallpapers | ✅ Firebase Storage |
| `/utility/v1/firmware/detail` | GET | Hardware firmware version info | ✅ Firestore |
| `/utility/v1/perp-config` | GET | Perp trading configuration | ✅ Firebase Remote Config |
| `/utility/v1/track` | POST | Analytics event ingestion | ✅ Firebase Analytics |

---

## 4. EARN Service — `earn.onekeycn.com`

DeFi staking, lending (Aave-style), yield farming, and rewards.

### All Endpoints

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/earn/v1/defi/supported-protocols` | GET | List of DeFi protocols (Lido, Aave…) | ✅ Firestore |
| `/earn/v1/defi/build-transaction` | POST | Build DeFi deposit/stake tx | ❌ needs SDK |
| `/earn/v1/on-chain/allowance` | GET | Check token allowance on-chain | ❌ RPC call |
| `/earn/v2/stake` | POST | Build staking transaction | ❌ needs SDK |
| `/earn/v1/unstake/push` | POST | Build unstake transaction | ❌ needs SDK |
| `/earn/v1/permit-signature` | POST | EIP-2612 permit signing helper | ❌ needs SDK |
| `/earn/v1/positions` | POST | Fetch active earn positions | ❌ needs indexer |
| `/earn/v1/claimable/list` | GET | Unclaimed rewards | ❌ needs indexer |
| `/earn/v1/withdraw/list` | GET | Pending withdrawals | ❌ needs indexer |
| `/earn/v1/orders` | POST | Sync earn order status | ✅ Firestore |
| `/earn/v1/rebate` | GET | Earn rewards/rebate summary (v1/v2) | ✅ Firestore |
| `/earn/v1/apy/history` | GET | Historical APY charts | ❌ needs DeFi data |
| `/earn/v1/sumsub/status` | GET | KYC verification status (Sumsub) | ⚠️ 3rd party |
| `/earn/v1/borrow/markets` | GET | Lending market list | ❌ on-chain |
| `/earn/v1/borrow/reserves` | GET | Lending reserve data | ❌ on-chain |
| `/earn/v1/borrow/histories` | GET | Lending transaction history | ❌ needs indexer |
| `/earn/v1/borrow/apy/history` | GET | Lending rate chart data | ❌ needs DeFi data |
| `/earn/v1/borrow/rewards` | GET | Lending reward claims | ❌ on-chain |
| `/earn/v1/borrow/faq/list` | GET | Lending FAQ content | ✅ Firestore |
| `/earn/v1/borrow/reserve-detail` | GET | Single reserve details | ❌ on-chain |
| `/earn/v1/borrow/build-supply-transaction` | POST | Build supply/collateral tx | ❌ needs SDK |
| `/earn/v1/borrow/manage-page` | GET | Lending dashboard data bundle | ❌ on-chain |
| `/earn/v1/recommend` | POST | Personalized earn recommendations | ✅ Cloud Functions |
| `/earn/v2/investment/detail` | GET | Detailed position info | ❌ needs indexer |

**How to build:** Use [Lido SDK](https://github.com/lidofinance/lido-ethereum-sdk) for staking, [Aave SDK](https://github.com/aave/aave-utilities) for lending. Use [DefiLlama API](https://defillama.com/docs/api) for protocol APY data — it's free.

---

## 5. NOTIFICATION Service — `notification.onekeycn.com`

Handles push notifications, in-app message inbox, price alerts, and real-time events.

### All Endpoints

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/notification/v1/account/register` | POST | Register device for push (FCM/APNs token) | ✅ FCM direct |
| `/notification/v1/account/unregister` | POST | Unregister device | ✅ FCM direct |
| `/notification/v1/hyperliquid-account/bind` | POST | Bind Hyperliquid account for alerts | ✅ Firestore |
| `/notification/v1/message/list` | GET | In-app notification inbox | ✅ Firestore |
| `/notification/v1/message/ack` | POST | Mark notifications read | ✅ Firestore |
| `/notification/v1/message/badges` | GET | Unread notification count | ✅ Firestore |
| `/notification/v1/watchlist/tokens` | POST | Token price alert watchlist | ✅ Firestore + Cloud Functions |
| `/notification/v1/config/query` | GET | User notification preferences | ✅ Firestore |
| `/notification/v1/config/update` | POST | Update notification preferences | ✅ Firestore |

### WebSocket Events (socket.io)

| Event | Direction | Purpose |
|---|---|---|
| `ping/pong` | bidirectional | Keepalive |
| `notification` | server→client | New notification delivery |
| `primeDeviceLogout` | server→client | Force logout on another device |
| `primeConfigChanged` | server→client | Config change push |
| `primeLockChanged` | server→client | Account lock state change |
| `primeConfigFlush` | server→client | Flush cached config |
| `setBadge` | server→client | Update unread badge count |
| `userInfoUpdated` | server→client | User profile changed |

### Firebase Plan (Full Replacement) ✅

```
Firebase Cloud Messaging (FCM)     ← push to mobile/web
Firestore (notifications collection) ← message inbox, watchlist, preferences
Firebase Cloud Functions            ← price alert triggers, badge count
Firebase Realtime Database          ← replace socket.io for real-time events
```

Price alert flow: Cloud Function runs on a schedule, checks prices via CoinGecko, writes to Firestore → triggers FCM push.

---

## 6. PRIME Service — `prime.onekeycn.com`

Auth, identity, KYT/AML compliance, cloud sync, and keyless wallet MPC shares.

### Auth & User Management

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/prime/v1/user/login` | POST | OneKey ID login (get auth token) | ✅ Firebase Auth |
| `/prime/v1/user/logout` | POST | Invalidate session | ✅ Firebase Auth |
| `/prime/v1/user/info` | GET | User profile | ✅ Firestore |
| `/prime/v1/user/devices` | GET | Linked devices list | ✅ Firestore |
| `/prime/v1/user/delete` | POST | Delete account | ✅ Firebase Auth + Cloud Functions |
| `/prime/v1/general/customer_jwt` | POST | Get customer JWT for sub-services | ✅ Firebase Custom Tokens |
| `/prime/v1/general/emailOTP` | POST | Email OTP flow | ✅ Firebase Auth (email link) |
| `/prime/v1/translate/dapp` | GET | DApp name/description translation | ✅ Firestore |

### KYT / Address Risk (Compliance)

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/prime/v1/kyt/enabled` | GET | Is KYT active for this user/region? | ✅ Remote Config |
| `/prime/v1/kyt/supported-assets` | GET | Assets with KYT coverage | ❌ compliance vendor |
| `/prime/v1/kyt/address-risk/supported-networks` | GET | Networks with address risk checking | ❌ compliance vendor |
| `/prime/v1/kyt/address-risk/check` | POST | Check an address for AML risk | ❌ compliance vendor |
| `/prime/v1/kyt/address-risk/details` | POST | Get detailed risk report | ❌ compliance vendor |

**Vendor options:** [Chainalysis](https://chainalysis.com), [Elliptic](https://elliptic.co), [TRM Labs](https://trmlabs.com). All provide address risk APIs. Skip initially; add before launch in regulated markets.

### Cloud Sync (Settings Backup)

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/prime/v1/sync/check` | GET | Check if cloud sync data exists | ✅ Firestore |
| `/prime/v1/sync/clear` | POST | Delete cloud sync data | ✅ Firestore |
| `/prime/v1/sync/download` | GET | Download backed-up settings | ✅ Firestore / Firebase Storage |

### Keyless Wallet (MPC Social Recovery)

These power "sign in with Google/Apple → no seed phrase" wallets using threshold signature (MPC/TSS).

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/prime/v1/keyless-wallet/createKeylessBackendShareV2` | POST | Store backend MPC key share | ✅ Firebase + E2EE |
| `/prime/v1/keyless-wallet/getKeylessBackendShareV2` | POST | Retrieve MPC key share | ✅ Firebase + E2EE |
| `/prime/v1/keyless-wallet/resetKeylessBackendShare` | POST | Replace key share | ✅ Firebase + E2EE |
| `/prime/v1/keyless-wallet/acquireCreationLock` | POST | Mutex for key creation | ✅ Firestore transactions |
| `/prime/v1/keyless-wallet/releaseCreationLock` | POST | Release mutex | ✅ Firestore transactions |
| `/prime/v1/keyless-wallet/getPinConfirmStatus` | POST | PIN confirmation state | ✅ Firestore |
| `/prime/v1/keyless-wallet/updatePinConfirmStatus` | POST | Update PIN state | ✅ Firestore |
| `/prime/v1/keyless-wallet/resetPinConfirmStatus` | POST | Reset PIN state | ✅ Firestore |
| `/prime/v1/keyless-wallet/resetPinDone` | POST | Signal PIN reset complete | ✅ Firestore |
| `/prime/v1/keyless-wallet/hasWrongProviders` | POST | Check for mismatched OAuth providers | ✅ Firebase Auth |

**Firebase plan for Keyless:** Firebase Auth (Google/Apple sign-in) + Cloud Functions to encrypt and store MPC shares in Firestore. The existing codebase uses Supabase + custom backend — Firebase Auth replaces Supabase auth directly.

---

## 7. REBATE Service — `rebate.onekeycn.com`

Referral and affiliate reward system.

### All Endpoints

| Endpoint | Method | What It Does | Firebase? |
|---|---|---|---|
| `/rebate/v1/invite/summary` | GET | Referral dashboard summary | ✅ Firestore |
| `/rebate/v1/invite/history` | GET | Referral history | ✅ Firestore |
| `/rebate/v1/invite/records` | GET | Individual referral records | ✅ Firestore |
| `/rebate/v1/invite/paid` | GET | Paid rewards history | ✅ Firestore |
| `/rebate/v1/invite/export` | POST | Export referral data CSV | ✅ Cloud Functions |
| `/rebate/v1/address` | POST | Register referral address | ✅ Firestore |
| `/rebate/v1/wallet/bind` | POST | Bind wallet to referral code | ✅ Firestore |
| `/rebate/v1/wallet/dev/unbind` | POST | Dev: unbind wallet (dev only) | ✅ Firestore |
| `/rebate/v1/wallet/message` | GET | Get wallet referral message to sign | ✅ Firestore |

**Firebase plan:** Fully covered by Firestore + Cloud Functions. Store referral codes, track invites, and compute rewards via scheduled Cloud Functions.

---

## 8. TRANSFER Service — `transfer.onekeycn.com`

End-to-end encrypted P2P transfer (wallet-to-wallet via QR or link, with E2EE).

The app uses a bridge-based proxy (`e2eeServerApiProxy.ts`) — it routes requests through an E2EE layer before hitting the transfer service. This is for OneKey Prime subscribers to send assets to each other without exposing addresses publicly.

**Firebase plan:** Firestore with end-to-end encrypted payloads + Cloud Functions as relay. Firebase Realtime Database for the real-time "pending transfer" state.

---

## 9. LIGHTNING Service

Lightning Network is handled via the **Lightning SDK** (`sdkLightning/ClientLightning.ts`), not direct HTTP calls. LNURL parsing and payment happen locally or via the receiving endpoint's own URL.

**FEM Wallet:** Integrate [Breez SDK](https://sdk-doc.breez.technology/) or [LND](https://lightning.engineering/) if you want Lightning support. Not needed initially.

---

## 10. Analytics & Infrastructure

### Analytics

| Feature | OneKey Implementation | Firebase Replacement |
|---|---|---|
| Event tracking | POST `/utility/v1/track` | Firebase Analytics (free, unlimited) |
| User attributes | POST `/utility/v1/track/attributes` | Firebase Analytics `setUserProperties` |
| Crash reporting | Sentry | Firebase Crashlytics |
| Performance | Custom timing | Firebase Performance Monitoring |

### IP Table CDN (Load Balancing)
- **URL:** `https://config.onekeycn.com/data.json`
- **Purpose:** Maps service hostnames to IPs for geo-routing and failover
- **Firebase plan:** Skip initially. Use Cloudflare for global routing instead.

### WebSocket / Real-time
- **Current:** socket.io connected to notification service
- **Firebase plan:** Firebase Realtime Database or Firestore `onSnapshot` listeners

### Authentication Token Flow
1. Social login → Supabase (current) / Firebase Auth (FEM)
2. `accessToken` → POST to `/prime/v1/user/login` → get `X-Onekey-Request-Token`
3. Token stored in `simpleDb.prime`
4. Attached to every authenticated request via Axios request interceptor
5. 401 error codes `90_002/90_003` → auto-logout

---

## 11. Firebase Architecture for FEM Wallet

```
Firebase Auth
  ├── Email/Password
  ├── Google OAuth (for Keyless Wallets)
  └── Apple Sign-In (for Keyless Wallets)

Firestore
  ├── /users/{uid}                  ← profile, devices, settings
  ├── /users/{uid}/notifications    ← message inbox
  ├── /users/{uid}/watchlist        ← price alerts
  ├── /users/{uid}/sync             ← cloud backup
  ├── /users/{uid}/keyless          ← encrypted MPC shares
  ├── /users/{uid}/referrals        ← rebate system
  ├── /dapps                        ← discovery catalog
  ├── /banners                      ← home/market banners
  └── /config                       ← global app config

Firebase Cloud Functions
  ├── onUserCreate                  ← init user doc
  ├── priceAlertChecker (scheduled) ← check prices, send FCM
  ├── computeRebates (scheduled)    ← calculate referral rewards
  ├── generateFiatUrl               ← proxy fiat provider
  └── kycWebhook                    ← receive KYC status from vendor

Firebase Cloud Messaging (FCM)
  └── push notifications to mobile + web

Firebase Remote Config
  ├── feature flags
  ├── app update info
  └── regional settings (KYT enabled, etc.)

Firebase Analytics + Crashlytics
  └── replaces Sentry + custom tracking

Firebase Storage
  └── OTA bundles, hardware wallpapers, log uploads
```

---

## 12. What Cannot Use Firebase (Needs Custom Backend or Third-Party)

| Feature | What to Use |
|---|---|
| Token portfolio/balances | Alchemy / Moralis / Covalent |
| Token prices + market data | CoinGecko API / CoinMarketCap |
| DEX charts/pools | GeckoTerminal API |
| Cross-chain swap | LI.FI / 1inch / 0x |
| Transaction history | Alchemy / Moralis |
| NFT metadata | Alchemy NFT API / Moralis |
| Gas estimation | Chain RPC / Blocknative |
| Token security check | GoPlus Security API |
| KYT/AML compliance | Chainalysis / TRM Labs |
| DeFi staking tx building | Lido SDK / Aave SDK |
| DeFi APY data | DefiLlama API |
| Fiat on-ramp | MoonPay / Transak / Ramp |
| Exchange rates | Fixer.io / Open Exchange Rates |

---

## 13. Where to Change the Endpoints in Code

To point FEM Wallet at its own backend, change these two files:

```
packages/shared/src/config/appConfig.ts
  → ONEKEY_API_HOST = 'api.femwallet.io'
  → ONEKEY_TEST_API_HOST = 'api-test.femwallet.io'

packages/shared/src/config/endpointsMap.ts
  → Each service maps to your own subdomains
```

For Firebase specifically, the API client layer (`appApiClient.ts`) will need a new client type that calls Firebase SDK methods instead of Axios for Firestore/Auth/FCM operations.
