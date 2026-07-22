---
name: Public RPC fallback for chains
description: How chains get RPC URLs when OneKey's backend is unreachable.
---

## The problem
EVM vaults call `ServiceCustomRpc.getCustomRpcForNetwork(networkId)` and throw
`OneKeyInternalError('No RPC url')` if nothing is returned. In Replit, OneKey's
backend (which normally seeds RPC URLs into the DB on startup) is unreachable,
so no RPCs are seeded and every chain call fails.

## The fix
- **`packages/shared/src/config/publicRpcUrls.ts`** — new file mapping networkId →
  public RPC URL for 60+ chains (EVM, Solana, BTC, Tron, TON, Cosmos, Near, Polkadot,
  Algorand, Stellar, Cardano, Sui, Aptos, Alephium, Conflux, Neo N3, Kaspa, Filecoin,
  Hedera, XRP, Litecoin, Dogecoin, BFC, Hyperliquid, and more).

- **`packages/kit-bg/src/services/ServiceCustomRpc.ts`** — `getCustomRpcForNetwork`
  now falls back to `getPublicRpcUrl(networkId)` when no user-configured RPC is
  stored, returning a synthetic `{ networkId, rpc, enabled: true }` object.

**Why:** Chains need to work out-of-the-box without requiring OneKey's backend.
User-configured custom RPCs still take priority.

**How to apply:** Add new chains to `publicRpcUrls.ts`. The fallback kicks in
whenever `simpleDb.customRpc.getCustomRpcForNetwork` returns null/disabled.
