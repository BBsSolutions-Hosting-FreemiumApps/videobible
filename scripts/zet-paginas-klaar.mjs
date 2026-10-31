/**
 * Kopieert de Astro-build naar de repositoryroot.
 * GitHub Pages staat op "Deploy from a branch: main / root".
 * De broncode blijft staan; alleen de gebouwde sitebestanden worden vervangen.
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = fileURLToPath(new URL('..', import.meta.url));
const dist = join(wortel, 'dist');
const manifestPad = join(wortel, 'scripts', 'publicatie-manifest.json');
const BESCHERMD = new Set([
  'package.json', 'package-lock.json', 'astro.config.mjs', 'tsconfig.json',
  'vitest.config.ts', 'README.md', '.gitignore',
]);
const BESCHERMDE_MAPPEN = new Set([
  'src', 'data', 'scripts', 'public', 'node_modules', 'dist', '.git', '.github', 'content',
]);

function lijst(map, basis = map, gevonden = []) {
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) lijst(pad, basis, gevonden);
    else gevonden.push(relative(basis, pad).split(sep).join('/'));
  }
  return gevonden;
}

function verwijderLeeg(pad) {
  let map = dirname(pad);
  while (map.startsWith(wortel) && map !== wortel) {
    const rel = relative(wortel, map).split(sep).join('/');
    const top = rel.split('/')[0];
    if (BESCHERMDE_MAPPEN.has(top)) return;
    if (readdirSync(map).length > 0) return;
    rmSync(map, { recursive: true });
    map = dirname(map);
  }
}

let vorige = [];
try {
  vorige = JSON.parse(readFileSync(manifestPad, 'utf8'));
} catch { /* eerste publicatie */ }

for (const rel of vorige) {
  const absoluut = join(wortel, rel);
  rmSync(absoluut, { force: true });
  try { verwijderLeeg(absoluut); } catch { /* map bestaat niet meer */ }
}

for (const naam of readdirSync(dist)) {
  if (BESCHERMD.has(naam) || BESCHERMDE_MAPPEN.has(naam)) {
    throw new Error(`De build wil een beschermd pad overschrijven: ${naam}`);
  }
  cpSync(join(dist, naam), join(wortel, naam), { recursive: true });
}

writeFileSync(join(wortel, '.nojekyll'), '');
const nieuw = lijst(dist);
if (!nieuw.includes('.nojekyll')) nieuw.push('.nojekyll');
mkdirSync(dirname(manifestPad), { recursive: true });
writeFileSync(manifestPad, `${JSON.stringify(nieuw.sort(), null, 2)}\n`);
console.log(`Statische site gekopieerd naar de root (${nieuw.length} bestanden).`);
