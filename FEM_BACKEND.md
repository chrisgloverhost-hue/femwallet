# FEM WALLET — Backend Architecture Reference

This document reverse-engineers how the OneKey backend works so FEM WALLET can build its own equivalent infrastructure.

---

## 1. Architecture Overview

OneKey's backend is a **multi-service microservices architecture** exposed via HTTPS REST APIs (and one WebSocket service). All services live under a common host pattern:

```
https://{serviceName}.onekeycn.com   ← production
https://{serviceName}.onekeytest.com ← test/staging
```

The frontend never calls a single monolith — it calls each service by name via a shared API client layer.

---

## 2. Services & Their Base URLs

| Service Enum | Prod Base URL | What It Does |
|---|---|---|
| `wallet` | `https://wallet.onekeycn.com` | Portfolio balances, token lists, account search |
| `swap` | `https://swap.onekeycn.com` | Cross-chain swaps: quotes, tx building, order tracking |
| `utility` | `https://utility.onekeycn.com` | DApp discovery, market data, app update checks |
| `notification` | `https://notification.onekeycn.com` | Push notification registration, message inbox |
| `notificationWebSocket` | `wss://notification.onekeycn.com` | Real-time push via WebSocket |
| `earn` | `https://earn.onekeycn.com` | DeFi staking protocols, yield calculation, tx building |
| `prime` | `https://prime.onekeycn.com` | OneKey ID auth (login/logout), KYT risk checks |
| `rebate` | `https://rebate.onekeycn.com` | Referral/invite system, reward history |
| `transfer` | `https://transfer.onekeycn.com` | Fiat on/off ramp transfers |
| `lightning` | `https://lightning.onekeycn.com` | Lightning Network invoice creation and auth |

**How FEM WALLET should structure this:**  
Replace `onekeycn.com` with your own domain, e.g. `api.femwallet.io`, and deploy each service as a separate subdomain or path prefix (e.g. `https://api.femwallet.io/wallet/...`).

---

## 3. URL Building Pattern

Defined in `packages/shared/src/config/appConfig.ts`:

```ts
export const ONEKEY_API_HOST = 'onekeycn.com';
export const ONEKEY_TEST_API_HOST = 'onekeytest.com';

export const buildServiceEndpoint = ({ serviceName, env, isWebSocket }) => {
  const baseHost = env === 'prod' ? ONEKEY_API_HOST : ONEKEY_TEST_API_HOST;
  return `${isWebSocket ? 'wss' : 'https'}://${serviceName}.${baseHost}`;
};
```

**FEM WALLET equivalent:**
```ts
export const FEM_API_HOST = 'api.femwallet.io';
export const FEM_TEST_API_HOST = 'api-test.femwallet.io';

export const buildServiceEndpoint = ({ serviceName, env, isWebSocket }) => {
  const baseHost = env === 'prod' ? FEM_API_HOST : FEM_TEST_API_HOST;
  return `${isWebSocket ? 'wss' : 'https'}://${serviceName}.${baseHost}`;
};
```

To point the app at your own backend, update `packages/shared/src/config/appConfig.ts` and `packages/shared/src/config/endpointsMap.ts`.

---

## 4. API Client Infrastructure

### 4.1 Axios Client Factory
**File:** `packages/shared/src/appApiClient/appApiClient.ts`

- Creates and **memoizes** (caches for 10 min) one Axios instance per service endpoint
- Supports an optional IP-table CDN adapter (`createIpTableAdapter`) for load balancing
- Dev proxy: if `ONEKEY_PROXY` env var is set, routes requests through a local proxy

```ts
appApiClient.getClient(EServiceEndpointEnum.Wallet)
// → Axios instance with baseURL = 'https://wallet.onekeycn.com'
```

Three client tiers:
| Method | Auth | Use Case |
|---|---|---|
| `getClient(service)` | None | Public read-only endpoints |
| `getOneKeyIdAuthClient(service)` | `X-Onekey-Request-Token` header | Authenticated user actions |
| `getRawDataClient(service)` | None | Raw binary/data responses |

### 4.2 Service Base Class
**File:** `packages/kit-bg/src/services/ServiceBase.ts`

All background services extend `ServiceBase`, which provides:
```ts
this.getClient(EServiceEndpointEnum.Wallet)       // anonymous
this.getOneKeyIdClient(EServiceEndpointEnum.Prime) // authenticated
```

---

## 5. Authentication

### 5.1 Standard (Anonymous) Requests
Most read endpoints (token prices, portfolio data) require no auth — just an HTTPS request with standard headers.

### 5.2 OneKey ID Authentication
**Header:** `X-Onekey-Request-Token: <token>`

The token is obtained via:
```
POST https://prime.onekeycn.com/prime/v1/user/login
```

The auth flow:
1. User logs in via OneKey ID (the `prime` service)
2. Token stored in `simpleDb` (local encrypted storage)
3. Every authenticated request auto-attaches the header via a **request interceptor**
4. **Response interceptor** catches error codes and auto-logs-out:
   - `90_002` — invalid token → force logout
   - `90_003` — expired token → force logout
   - `90_004`, `90_005`, `90_006` — other auth errors → show alert

**FEM WALLET:** Implement your own JWT-based auth. Replace the `prime` service with your own `/auth/login` endpoint and store the token the same way.

---

## 6. Key API Endpoints

### Wallet Service (`wallet.onekeycn.com`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/wallet/v1/health` | GET | Health check |
| `/wallet/v1/portfolio/positions` | POST | Get token balances for an account |
| `/wallet/v1/account/token/search-batch` | POST | Batch token search across chains |

### Swap Service (`swap.onekeycn.com`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/swap/v1/quote` | POST | Get swap quote (price, route, fee) |
| `/swap/v1/build-tx` | POST | Build the swap transaction |
| `/swap/v1/order-detail` | GET | Check swap order status |

### Utility Service (`utility.onekeycn.com`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/utility/v1/market/tokens` | GET | Token market prices |
| `/utility/v1/discover/dapp/homepage` | GET | DApp discovery list |
| `/utility/v1/app-update` | GET | Check for app updates |

### Notification Service (`notification.onekeycn.com`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/notification/v1/account/register` | POST | Register device for push notifications |
| `/notification/v1/message/list` | GET | Get notification inbox |

### Earn Service (`earn.onekeycn.com`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/earn/v1/defi/supported-protocols` | GET | List staking/yield protocols |
| `/earn/v1/defi/build-transaction` | POST | Build a DeFi deposit/stake tx |

### Prime Service (`prime.onekeycn.com`) — Auth + Risk
| Endpoint | Method | Purpose |
|---|---|---|
| `/prime/v1/user/login` | POST | OneKey ID login |
| `/prime/v1/kyt/address-risk/check` | POST | Check address for KYT/AML risk |

---

## 7. IP Table CDN (Load Balancing)
**Config URL:** `https://config.onekeycn.com/data.json`  
**Fetch timeout:** 5 seconds

OneKey fetches a CDN-hosted IP table to support geo-based routing and failover. The frontend fetches this JSON on startup and uses it to select the best regional endpoint.

**FEM WALLET:** You can skip this initially and use a single regional endpoint. Add CDN-based routing later as you scale.

---

## 8. Environment Variable Overrides

| Variable | Purpose |
|---|---|
| `ONEKEY_API_HOST` | Override production API host |
| `ONEKEY_TEST_API_HOST` | Override test API host |
| `ONEKEY_PROXY` | Route all API requests through a local proxy (dev only) |
| `HARDWARE_SDK_CONNECT_SRC` | Override Hardware JS SDK source URL |

---

## 9. What FEM WALLET Needs to Build

To replace OneKey's backend, FEM WALLET needs these services at minimum:

### Must-Have (Core Wallet)
1. **`/wallet`** — Portfolio balances via RPC or an indexer (e.g. Moralis, Covalent, Alchemy)
2. **`/utility`** — Token price data (can proxy CoinGecko/CoinMarketCap)
3. **`/auth`** — User login/session (JWT-based, replaces `prime`)

### Should-Have
4. **`/swap`** — Integrate a swap aggregator (1inch, LiFi, Socket.tech) and wrap it
5. **`/notification`** — Push notification delivery (Firebase FCM for mobile)

### Nice-to-Have
6. **`/earn`** — DeFi protocol integrations (Lido, Aave, etc.)
7. **`/rebate`** — Referral system

### Where to Plug Your URLs In
All endpoint URLs live in two files:
- `packages/shared/src/config/appConfig.ts` — change `ONEKEY_API_HOST` / `ONEKEY_TEST_API_HOST`
- `packages/shared/src/config/endpointsMap.ts` — maps service enums to full URLs

Change those two files to point every service at your own infrastructure.

---

## 10. Health Check Endpoint

The app polls `/wallet/v1/health` to check connectivity (used by the offline banner).  
Your `wallet` service **must** expose:
```
GET /wallet/v1/health → 200 OK
```
This is the minimum to stop the "offline" banner from showing.
