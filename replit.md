# OneKey app-monorepo (Replit setup)

## Overview
This is OneKey's `app-monorepo` — a multi-target crypto wallet codebase (web,
desktop/Electron, browser extension, and React Native mobile) built as a
Yarn 4 (Berry) workspace monorepo. This Replit project is configured to run
the **web** target for the preview pane.

## Running the app
- The `Start application` workflow runs `WEB_PORT=5000 yarn app:web` (rspack
  dev server), which is what the preview pane displays.
- The dev server already had `allowedHosts: 'all'` configured upstream
  (`development/rspack/rspack.development.config.ts`), so no extra host
  config was needed for Replit's proxied preview.
- `.env` was created from `.env.example` with blank secret values (the app's
  own defaults). Fill in real values there (or via Replit's secrets tooling)
  if a feature needs a specific third-party API key.

## Environment-specific workarounds applied to get `yarn install` working
Replit's environment routes package downloads through an internal proxy
(`package-firewall.replit.local`) that (a) is plain HTTP, which Yarn Berry
blocks by default, and (b) actively blocks specific package versions flagged
by a security policy (critical CVEs or malware). To get a clean install:

- `.yarnrc.yml`: added `unsafeHttpWhitelist: [package-firewall.replit.local]`
  so Yarn accepts the internal HTTP proxy.
- Root `package.json` `resolutions` were added/adjusted to steer around
  versions the firewall blocks for known CVEs: `protobufjs` bumped to `8.7.0`
  (was pinned to the vulnerable `6.11.4`, used by the hardware-wallet SDK
  `@onekeyfe/hd-transport` — this is a **major version bump**, so hardware
  wallet protobuf decoding is unverified in this environment and should be
  retested before relying on real hardware-wallet flows), plus `form-data`
  (`4.0.6`), `@bundlr-network/client` (`0.11.17`, replacing an older
  `avsc`-based dependency chain).
- `babel-plugin-catch-logger` (dev-only auto error-logging Babel plugin) was
  removed from `package.json` and its usage guarded out in
  `development/babelTools.js`, because its dependency `babel-traverse@6.26.0`
  is an abandoned package with no non-vulnerable release.
- **Security note:** the firewall flagged `@onekeyfe/inpage-providers-hub`
  (a dependency of OneKey's own `@onekeyfe/cross-inpage-provider-injected`,
  used for in-app browser / DApp wallet injection) versions `2.2.40` through
  the latest `2.2.73` as containing malware that hijacks crypto transactions
  on HyperLiquid-based dApps; versions up to `2.2.30` are clean. A
  resolution pins `@onekeyfe/inpage-providers-hub` to `2.2.39` (last clean
  version found) so install can proceed. **This should be independently
  verified against OneKey's real npm publishing history** — it may be a
  scanner false positive (the package's legitimate job is intercepting
  dApp transactions for wallet injection, which can resemble the heuristic
  the scanner flagged), or it may indicate a genuine compromise of OneKey's
  npm scope that the team should investigate and rotate/republish clean
  versions for.
- The `development/scripts/web-embed.js` local-dev build step (which
  produces the web-embed bundle consumed only by native mobile WebViews) is
  now wrapped in a try/catch — it OOMs in this environment's ~8GB RAM
  budget. On failure it logs a warning and continues instead of blocking
  `yarn install`. This does not affect the web app dev server; it would only
  matter for building the mobile app's embedded web bundle.
- Installed system packages: `python3`, `systemd` (for `libudev.h`), and
  `pkg-config`, needed to compile native Node modules (`usb`,
  `@stoprocent/noble`) used for hardware-wallet USB/Bluetooth support.

## Web navigation: wallet mode vs dapp-portal mode
The web app has a built-in mode switch (`packages/shared/src/utils/devModeUtils.ts`,
`isWebInDappMode()` / `WEB_DAPP_MODE_STORAGE_KEY` in `localStorage`) that decides
between two very different navigation shells:
- **dapp-portal mode** (the old default): a horizontal top nav (Market / Perps /
  DeFi / Trade / Referral) aimed at browsing without a wallet — no account
  balance/sidebar.
- **wallet mode**: the real wallet-first experience — a left sidebar on desktop
  widths (Wallet / Market / Trade / Perps / DeFi / Referral / Browser / Dev
  mode) or a bottom tab bar on narrow/mobile widths (Wallet / Trade / Perp /
  Discover, shared with the native app), account selector, balance, etc.

The default was flipped to **wallet mode** so this matches the native app's
experience out of the box. To go back to dapp-portal mode for testing, set
`localStorage.setItem('$onekey_web_dapp_mode', 'dapp')` and reload.

Note: the bottom-tab-bar component (`MobileBottomTabBar`) is only meant for
narrow/touch-sized viewports — it is not styled for desktop-width windows.
The desktop-width equivalent is the left sidebar (`DesktopLeftSideBar`), which
is the intended wide-screen counterpart, not a separate/lesser experience.

## User preferences
- Use **yarn**, not npm, for all package management in this project.
