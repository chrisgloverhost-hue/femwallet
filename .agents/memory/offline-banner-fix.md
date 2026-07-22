---
name: Offline banner fix — web connectivity check
description: Why the "You are offline" banner shows in Replit/dev and how it was fixed.
---

## The problem
`NetworkReachabilityTracker.tsx` polls `${walletEndpoint}/wallet/v1/health` (where
`walletEndpoint` is resolved from OneKey's IP-table CDN, e.g. `https://wallet.onekey.so`).
In Replit that endpoint is unreachable, so every check returns false → banner shows.

## The fix (two files)
1. **`packages/kit/src/provider/Container/NetworkReachabilityTracker.tsx`** — added
   `buildReachabilityUrl()` that uses `window.location.origin` as the base when
   `platformEnv.isWeb`, falling back to the backend endpoint on native/desktop.

2. **`development/rspack/rspack.development.config.ts`** — enabled `setupMiddlewares`
   to serve `GET /wallet/v1/health → 200 { ok:true, env:'dev' }` from the rspack
   dev server, so the local health check always passes.

**Why:** On web the health check must use same-origin fetch (no CORS issues) pointing
to a URL the dev server controls. Native/desktop keep using the real backend endpoint.

**How to apply:** Any time the "offline" banner appears in a web dev environment,
check that both pieces are in place — the `platformEnv.isWeb` branch in
`buildReachabilityUrl` and the `setupMiddlewares` health endpoint in the dev config.
