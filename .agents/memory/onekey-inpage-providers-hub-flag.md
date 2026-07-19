---
name: OneKey inpage-providers-hub flagged as malware
description: Socket security scanner flags recent versions of OneKey's own inpage-providers-hub package; needs upstream investigation.
---

Replit's package firewall (Socket Security Policy) blocks
`@onekeyfe/inpage-providers-hub` versions `2.2.40` through the latest
published `2.2.73` with "Known malware — hijacks crypto transactions on
HyperLiquid-based dApps". Versions `2.2.0`–`2.2.34` (excluding a missing
`2.2.35`) return clean. This package is a transitive dependency of OneKey's
own `@onekeyfe/cross-inpage-provider-injected` (used for in-app browser /
DApp wallet-provider injection), which pins it to an exact matching version
per release.

**This needs real investigation, not just a local workaround.** Two
plausible explanations:
- False positive: the package's legitimate purpose (intercepting dApp
  transaction requests to route them through the wallet) can resemble the
  scanner's heuristic for "transaction hijacking" malware.
- Genuine compromise: something injected into OneKey's npm scope between
  2.2.34 and 2.2.40 that persisted through many subsequent releases.

Local mitigation used so far: pin `@onekeyfe/inpage-providers-hub` via a
`resolutions` override to `2.2.39` (last version confirmed clean) so
installs can proceed. This does not fix the upstream package — OneKey
maintainers should verify with Socket/npm directly and, if genuine,
rotate/republish clean versions.

Also note: firewall block status for a given package/version is not fully
stable — the same version can return `403` in one check and `200` shortly
after (observed with `2.2.40` and `2.2.73` of the sibling package). Re-check
before trusting a single curl result if the finding is surprising.
