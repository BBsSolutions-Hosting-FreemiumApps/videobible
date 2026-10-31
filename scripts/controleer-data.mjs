import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = fileURLToPath(new URL('..', import.meta.url));
const lees = (rel) => JSON.parse(readFileSync(join(wortel, rel), 'utf8'));
const fouten = [];
const boeken = lees('data/boeken.json');
const structuur = lees('data/versstructuur.json');
const videos = lees('data/videos.json');
const plannen = lees('data/leesplannen.json');
const bron = lees('data/bron-tekst.json');

if (boeken.length !== 66) fouten.push(`Verwacht 66 boeken, vond ${boeken.length}`);
if (!bron.vermelding?.includes('Jantinus Daling') || !bron.vermelding.includes('gnu.org/licenses/fdl')) {
  fouten.push('Licentievermelding van het bronbestand ontbreekt');
}
if (bron.publiekeRechten !== 'Auteursrecht © 2026 Elohim YHWH Bijbel') {
  fouten.push('Publieke rechtenregel wijkt af');
}

for (const boek of boeken) {
  const bestand = lees(`data/bijbel/nbg1951/${boek.id}.json`);
  const aantallen = structuur.boeken[boek.id];
  if (!aantallen || aantallen.length !== boek.hoofdstukken || bestand.hoofdstukken.length !== boek.hoofdstukken) {
    fouten.push(`${boek.id}: hoofdstukaantal wijkt af`);
    continue;
  }
  bestand.hoofdstukken.forEach((hoofdstuk, index) => {
    if (hoofdstuk.verzen.length !== aantallen[index]) {
      fouten.push(`${boek.id} ${hoofdstuk.nr}: aantal verzen wijkt af`);
    }
    hoofdstuk.verzen.forEach((vers, versIndex) => {
      if (vers.nr !== versIndex + 1 || !vers.tekst?.trim()) {
        fouten.push(`${boek.id} ${hoofdstuk.nr}: vers ${vers.nr} is leeg of niet aaneengesloten`);
      }
      if (vers.tekst.includes('[Voorbeeldtekst') || vers.tekst.includes('DeuteronoDeu')) {
        fouten.push(`${boek.id} ${hoofdstuk.nr}:${vers.nr} bevat een placeholder of een kapotte naam`);
      }
    });
  });
}

const joh = lees('data/bijbel/nbg1951/joh.json');
const joh316 = joh.hoofdstukken.find((h) => h.nr === 3).verzen.find((v) => v.nr === 16).tekst;
if (!joh316.startsWith('Want alzo lief heeft God de wereld gehad')) {
  fouten.push('Johannes 3:16 wijkt af van het bronbestand');
}

for (const video of videos) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(video.youtubeId)) fouten.push(`Ongeldig video-id ${video.youtubeId}`);
  if (video.verwijzing !== null) {
    const boek = boeken.find((item) => item.id === video.verwijzing.boek);
    const max = structuur.boeken[video.verwijzing.boek]?.[video.verwijzing.hoofdstuk - 1];
    if (!boek || !max || video.verwijzing.van < 1 || video.verwijzing.tot > max) {
      fouten.push(`Verwijzing van ${video.id} bestaat niet`);
    }
  }
}
if (plannen.some((plan) => plan.lezingen?.length)) fouten.push('Leesplannen mogen nog geen dagindeling bevatten');
if (readdirSync(join(wortel, 'data', 'bijbel', 'nbg1951')).length !== 66) {
  fouten.push('Niet elk boek heeft een tekstbestand');
}

if (fouten.length) {
  console.error(fouten.slice(0, 30).join('\n'));
  process.exit(1);
}
console.log(`Data in orde: ${boeken.length} boeken, ${videos.length} video's.`);
