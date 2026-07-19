#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exit } = require('process');

require('../env');

const BASEDIR = path.dirname(__filename);
const webBuildPath = path.resolve(BASEDIR, '../../apps/web-embed/web-build');

// EAS build
if (process.env.EAS_BUILD) {
  console.log('build web-embed on EAS_BUILD');
  require('child_process').execSync('yarn app:web-embed:build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=8192',
      NODE_ENV: 'production',
    },
  });
  exit(0);
}

// GitHub Actions
if (process.env.GITHUB_SHA) {
  console.log('No need to compile web-embed');
  exit(0);
}

// Local development
if (!fs.existsSync(webBuildPath)) {
  console.log('build web-embed on local development');
  try {
    require('child_process').execSync('yarn app:web-embed:build', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096',
      },
    });
  } catch (error) {
    // The web-embed bundle is only consumed by native (mobile) WebViews and
    // is not required to run the web app's dev server. In memory-constrained
    // environments the production webpack build can OOM; don't let that
    // block `yarn install` / the rest of the web app setup.
    console.warn(
      'Skipping web-embed build: it failed to complete (this only affects native WebView embeds, not the web app dev server).',
    );
    console.warn(error && error.message ? error.message : error);
    fs.mkdirSync(webBuildPath, { recursive: true });
  }
}
