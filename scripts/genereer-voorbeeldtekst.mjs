/**
 * Zet gemarkeerde voorbeeldverzen klaar als er nog geen echte tekst is.
 * Overschrijft geen bestand met voorbeeld:false, tenzij --force is gezet.
 *
 *   node scripts/genereer-voorbeeldtekst.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = fileURLToPath(new URL('..', import.meta.url));
const force = process.argv.includes('--force');
const boeken = JSON.parse(readFileSync(join(wortel, 'data', 'boeken.json'), 'utf8'));
const structuur = JSON.parse(readFileSync(join(wortel, 'data', 'versstructuur.json'), 'utf8'));
const doel = join(wortel, 'data', 'bijbel', 'nbg1951');
mkdirSync(doel, { recursive: true });

for (const boek of boeken) {
  const pad = join(doel, `${boek.id}.json`);
  if (existsSync(pad) && !force) {
    const bestaand = JSON.parse(readFileSync(pad, 'utf8'));
    if (bestaand.voorbeeld === false) continue;
  }
  const aantallen = structuur.boeken[boek.id];
  const hoofdstukken = aantallen.map((aantal, index) => ({
    nr: index + 1,
    verzen: Array.from({ length: aantal }, (_, vers) => ({
      nr: vers + 1,
      tekst: `[Voorbeeldtekst vers ${vers + 1} — NBG 1951]`,
    })),
  }));
  writeFileSync(pad, `${JSON.stringify({
    boek: boek.id,
    naam: boek.naam,
    testament: boek.testament,
    voorbeeld: true,
    bron: null,
    hoofdstukken,
  }, null, 2)}\n`);
  console.log(`Voorbeeldtekst geschreven voor ${boek.id}`);
}
