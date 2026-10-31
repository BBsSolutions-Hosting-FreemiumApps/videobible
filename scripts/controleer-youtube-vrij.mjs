/**
 * De gebouwde HTML mag geen YouTube-verzoek starten.
 * Alleen de afgesproken playlistlink op Over is toegestaan.
 * De embed-URL mag alleen in het script staan en pas na een klik worden gezet.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = fileURLToPath(new URL('..', import.meta.url));
const dist = join(wortel, 'dist');
const PLAYLIST = 'https://www.youtube.com/playlist?list=PLNnDTBez4hlY';
const fouten = [];

function bestanden(map, eindigt) {
  const uit = [];
  for (const naam of readdirSync(map)) {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) uit.push(...bestanden(pad, eindigt));
    else if (naam.endsWith(eindigt)) uit.push(pad);
  }
  return uit;
}

const attr = /(?:href|src|srcset|poster|action)\s*=\s*(["'])([\s\S]*?)\1/gi;
for (const pad of bestanden(dist, '.html')) {
  const html = readFileSync(pad, 'utf8');
  for (const match of html.matchAll(attr)) {
    const waarde = match[2];
    if (!/youtube|ytimg|googlevideo|youtu\.be/i.test(waarde)) continue;
    if (waarde === PLAYLIST) continue;
    fouten.push(`${relative(wortel, pad)} bevat ${waarde}`);
  }
}

for (const pad of bestanden(dist, '.js')) {
  let js = readFileSync(pad, 'utf8').split('https://www.youtube-nocookie.com/embed/').join('');
  if (/ytimg\.com|googlevideo\.com|youtu\.be|youtube\.com/i.test(js)) {
    fouten.push(`${relative(wortel, pad)} bevat een YouTube-adres buiten de nocookie-embed`);
  }
}

if (fouten.length) {
  console.error(fouten.join('\n'));
  process.exit(1);
}
console.log('Geen YouTube-verzoeken in de statische HTML.');
