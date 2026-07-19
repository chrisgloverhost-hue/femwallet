---
name: Replit package-firewall + Yarn Berry install failures
description: Why `yarn install` fails in Replit on Yarn 4 (Berry) monorepos, and the two distinct fixes needed.
---

Replit routes package downloads through an internal proxy
(`package-firewall.replit.local`, surfaced via `npm_config_registry` /
`YARN_NPM_REGISTRY_SERVER`). Two independent things can break `yarn install`
because of this, and they look similar but need different fixes:

1. **Plain HTTP registry** — Yarn Berry refuses HTTP registries by default
   (`YN0081: Unsafe http requests must be explicitly whitelisted`). Fix:
   `yarn config set unsafeHttpWhitelist --json '["package-firewall.replit.local"]'`
   (writes to `.yarnrc.yml`). Do this first — it's a blanket failure affecting
   every package, not just specific ones.

2. **Socket Security Policy blocking specific tarballs** — even after (1),
   the firewall still returns real `403`s with an `Npm-Notice` header for
   individual package/version combos it considers a Critical CVE or known
   malware. `yarn install` reports these as `YN0035: The remote server
   failed to provide the requested resource`. Diagnose with
   `curl -sS -o /dev/null -w "%{http_code}" http://package-firewall.replit.local/npm/<pkg>/-/<pkg>-<version>.tgz`
   — a `403` body contains a `Reason:` field (e.g. "Critical CVE" or "Known
   malware") you can read directly with `curl ... | head -c 400`.

**Fix for (2):** add a `resolutions` entry in the root `package.json` pinning
the blocked package (or an ancestor package that pulls it in) to a version
the firewall allows — check firewall status for candidate versions with the
same curl trick before committing to one. This is a legitimate fix, not just
an environment workaround: it also removes a real vulnerable/malicious
dependency from the install. Don't just swap registries or disable the
firewall — the block is often catching something real (see the
`onekey-inpage-providers-hub-flag.md` note for a case where an org's own
published package got flagged).

Also watch for **duplicate keys in `resolutions`** when editing a large
existing `package.json` by hand — a later duplicate key silently overrides
an earlier fix and yarn will keep resolving the blocked version.
