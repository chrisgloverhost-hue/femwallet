---
name: Yarn binary restore
description: How to recover when .yarn/releases/yarn-4.12.0.cjs is missing after import/clone.
---

**Rule:** After cloning this repo, .yarn/releases/ is empty. Workflow fails with MODULE_NOT_FOUND.

**Fix:**
```bash
mkdir -p .yarn/releases
curl -fsSL https://repo.yarnpkg.com/4.12.0/packages/yarnpkg-cli/bin/yarn.js -o .yarn/releases/yarn-4.12.0.cjs
node .yarn/releases/yarn-4.12.0.cjs install --network-timeout 30000
```

**Why:** Yarn Berry binary is gitignored but .yarnrc.yml references it at `yarnPath`.

**Install time:** ~1.5 min from .yarn/cache (4437 cached zips). Full network download hits 429 rate limiting.

**How to apply:** Any time workflow fails with "Cannot find module .yarn/releases/yarn-4.12.0.cjs".
