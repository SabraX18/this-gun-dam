import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1]);
assert(assets.some((asset) => asset.endsWith('.js')), 'Build must include game JavaScript');
assert(assets.some((asset) => asset.endsWith('.css')), 'Build must include game styles');

// The same artifact must load from Vercel's root and the Pages subdirectory.
for (const mount of ['/', '/this-gun-dam/']) {
  for (const page of [mount, `${mount}index.html`]) {
    for (const asset of assets) {
      const url = new URL(asset, `https://game.example${page}`);
      assert.equal(url.origin, 'https://game.example', `Unexpected external asset: ${asset}`);
      assert(url.pathname.startsWith(mount), `Asset escapes hosting mount: ${url.pathname}`);
      const file = resolve(dist, decodeURIComponent(url.pathname.slice(mount.length)));
      assert(file.startsWith(`${resolve(dist)}${sep}`), `Asset escapes build output: ${asset}`);
      assert(statSync(file, { throwIfNoEntry: false })?.isFile(),
        `${page} requests missing built asset: ${url.pathname}`);
    }
  }
}

console.log(`Verified ${assets.length} built assets at root and subdirectory mounts.`);
