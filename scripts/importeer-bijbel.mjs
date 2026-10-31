/**
 * Importeert NBG 1951-USFM (of JSON) naar data/bijbel/nbg1951/.
 *
 * Gebruik:
 *   node scripts/importeer-bijbel.mjs /pad/naar/usfm-map
 *   node scripts/importeer-bijbel.mjs /pad/naar/nldnbg_usfm.zip
 *   node scripts/importeer-bijbel.mjs /pad/naar/verzen.json
 *
 * Het script haalt zelf niets van internet. De bron van deze startversie is
 * https://ebible.org/Scriptures/nldnbg_usfm.zip (zie data/bron-tekst.json).
 *
 * JSON-invoer is een array van
 *   { boek|book, hoofdstuk|chapter, vers|verse, tekst|text }
 * of een map met bestanden die al de doelform hebben.
 */
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = fileURLToPath(new URL('..', import.meta.url));
const doelMap = join(wortel, 'data', 'bijbel', 'nbg1951');
const BRON_URL = 'https://ebible.org/Scriptures/nldnbg_usfm.zip';

/** usfm-id, site-id, testament, korte naam, extra aliassen (naast de bronnaam). */
const DEF = [
  ['GEN', 'gen', 'OT', 'Gen.', ['Gen', 'Gn']],
  ['EXO', 'ex', 'OT', 'Ex.', ['Ex', 'Exo', 'Exod']],
  ['LEV', 'lev', 'OT', 'Lev.', ['Lev']],
  ['NUM', 'num', 'OT', 'Num.', ['Num', 'Nu']],
  ['DEU', 'deut', 'OT', 'Deut.', ['Deut', 'Dt', 'Deuteronomium']],
  ['JOS', 'joz', 'OT', 'Joz.', ['Joz']],
  ['JDG', 'richt', 'OT', 'Richt.', ['Richt', 'Ri', 'Rechters']],
  ['RUT', 'ruth', 'OT', 'Ruth', ['Ru']],
  ['1SA', '1sam', 'OT', '1 Sam.', ['1 Sam', '1 Samuel', '1Sam']],
  ['2SA', '2sam', 'OT', '2 Sam.', ['2 Sam', '2 Samuel', '2Sam']],
  ['1KI', '1kon', 'OT', '1 Kon.', ['1 Kon', '1K']],
  ['2KI', '2kon', 'OT', '2 Kon.', ['2 Kon', '2K']],
  ['1CH', '1kron', 'OT', '1 Kron.', ['1 Kron', '1Kr']],
  ['2CH', '2kron', 'OT', '2 Kron.', ['2 Kron', '2Kr']],
  ['EZR', 'ezra', 'OT', 'Ezra', ['Ezr']],
  ['NEH', 'neh', 'OT', 'Neh.', ['Neh']],
  ['EST', 'est', 'OT', 'Est.', ['Est', 'Esth', 'Esther']],
  ['JOB', 'job', 'OT', 'Job', []],
  ['PSA', 'ps', 'OT', 'Ps.', ['Ps', 'Psalm', 'Psalmen']],
  ['PRO', 'spr', 'OT', 'Spr.', ['Spr']],
  ['ECC', 'pred', 'OT', 'Pred.', ['Pred', 'Pr']],
  ['SNG', 'hoogl', 'OT', 'Hoogl.', ['Hoogl', 'Hgl']],
  ['ISA', 'jes', 'OT', 'Jes.', ['Jes']],
  ['JER', 'jer', 'OT', 'Jer.', ['Jer']],
  ['LAM', 'klaagl', 'OT', 'Klaagl.', ['Klaagl', 'Kla']],
  ['EZK', 'ezech', 'OT', 'Ezech.', ['Ezech', 'Ez']],
  ['DAN', 'dan', 'OT', 'Dan.', ['Dan', 'Daniel']],
  ['HOS', 'hos', 'OT', 'Hos.', ['Hos']],
  ['JOL', 'joel', 'OT', 'Joël', ['Joel', 'Jl']],
  ['AMO', 'am', 'OT', 'Am.', ['Am']],
  ['OBA', 'ob', 'OT', 'Ob.', ['Ob', 'Obad']],
  ['JON', 'jona', 'OT', 'Jona', ['Jon']],
  ['MIC', 'mi', 'OT', 'Mi.', ['Mi', 'Mich']],
  ['NAM', 'nah', 'OT', 'Nah.', ['Nah']],
  ['HAB', 'hab', 'OT', 'Hab.', ['Hab']],
  ['ZEP', 'sef', 'OT', 'Sef.', ['Sef', 'Zef', 'Zefanja']],
  ['HAG', 'hag', 'OT', 'Hag.', ['Hag', 'Haggaï']],
  ['ZEC', 'zach', 'OT', 'Zach.', ['Zach', 'Za']],
  ['MAL', 'mal', 'OT', 'Mal.', ['Mal']],
  ['MAT', 'mat', 'NT', 'Mat.', ['Mat', 'Mt', 'Mattheüs', 'Matthéüs', 'Mattheus', 'Matteus']],
  ['MRK', 'marc', 'NT', 'Mark.', ['Marc', 'Mr', 'Mk', 'Mrk', 'Markus']],
  ['LUK', 'luc', 'NT', 'Luk.', ['Luc', 'Lk', 'Luk', 'Lukas']],
  ['JHN', 'joh', 'NT', 'Joh.', ['Joh', 'Jh', 'Jhn']],
  ['ACT', 'hand', 'NT', 'Hand.', ['Hand', 'Hnd']],
  ['ROM', 'rom', 'NT', 'Rom.', ['Rom']],
  ['1CO', '1kor', 'NT', '1 Kor.', ['1 Kor', '1Kor', '1 Korinthe', '1 Korintiers', '1 Korintiërs']],
  ['2CO', '2kor', 'NT', '2 Kor.', ['2 Kor', '2Kor', '2 Korinthe', '2 Korintiers', '2 Korintiërs']],
  ['GAL', 'gal', 'NT', 'Gal.', ['Gal']],
  ['EPH', 'ef', 'NT', 'Ef.', ['Ef', 'Efeze']],
  ['PHP', 'fil', 'NT', 'Fil.', ['Fil', 'Flp']],
  ['COL', 'kol', 'NT', 'Kol.', ['Kol']],
  ['1TH', '1tess', 'NT', '1 Tess.', ['1 Tess', '1Thess', '1 Thess', '1 Thessalonicenzen']],
  ['2TH', '2tess', 'NT', '2 Tess.', ['2 Tess', '2Thess', '2 Thess', '2 Thessalonicenzen']],
  ['1TI', '1tim', 'NT', '1 Tim.', ['1 Tim', '1Tim', '1 Timotheüs', '1 Timotheus']],
  ['2TI', '2tim', 'NT', '2 Tim.', ['2 Tim', '2Tim', '2 Timotheüs', '2 Timotheus']],
  ['TIT', 'tit', 'NT', 'Tit.', ['Tit']],
  ['PHM', 'filem', 'NT', 'Filem.', ['Filem', 'Flm', 'Filémon']],
  ['HEB', 'hebr', 'NT', 'Hebr.', ['Heb', 'Hebr']],
  ['JAS', 'jak', 'NT', 'Jak.', ['Jak']],
  ['1PE', '1petr', 'NT', '1 Petr.', ['1 Petr', '1Pet']],
  ['2PE', '2petr', 'NT', '2 Petr.', ['2 Petr', '2Pet']],
  ['1JN', '1joh', 'NT', '1 Joh.', ['1 Joh', '1Joh', '1 Jo']],
  ['2JN', '2joh', 'NT', '2 Joh.', ['2 Joh', '2Joh']],
  ['3JN', '3joh', 'NT', '3 Joh.', ['3 Joh', '3Joh']],
  ['JUD', 'jud', 'NT', 'Jud.', ['Jud']],
  ['REV', 'openb', 'NT', 'Openb.', ['Op', 'Openb']],
];

const perUsfm = new Map(DEF.map((rij) => [rij[0], rij]));

function isCorrupt(naam) {
  return /DeuteronoDeu|DeuteronDeu/i.test(naam);
}

function leesUsfm(tekst, bestandsnaam) {
  const meta = { id: '', h: '', toc1: '', toc2: '' };
  /** @type {Map<number, { nr: string, tekst: string }[]>} */
  const hoofdstukken = new Map();
  let hoofdstuk = 0;

  for (const regel of tekst.split(/\r?\n/)) {
    if (regel.startsWith('\\id ')) meta.id = regel.slice(4).trim().split(/\s+/)[0];
    else if (regel.startsWith('\\h ')) meta.h = regel.slice(3).trim();
    else if (regel.startsWith('\\toc1 ')) meta.toc1 = regel.slice(6).trim();
    else if (regel.startsWith('\\toc2 ')) meta.toc2 = regel.slice(6).trim();
    else if (regel.startsWith('\\c ')) {
      hoofdstuk = Number(regel.slice(3).trim().split(/\s+/)[0]);
      if (!hoofdstukken.has(hoofdstuk)) hoofdstukken.set(hoofdstuk, []);
    } else if (regel.startsWith('\\v ')) {
      const zonder = regel.slice(3).trim();
      const spatie = zonder.indexOf(' ');
      if (spatie < 0) {
        throw new Error(`Leeg vers in ${bestandsnaam}: ${regel}`);
      }
      const nr = zonder.slice(0, spatie);
      const lichaam = zonder.slice(spatie + 1).replace(/\s+/g, ' ').trim();
      if (!hoofdstuk) throw new Error(`Vers vóór hoofdstuk in ${bestandsnaam}: ${nr}`);
      hoofdstukken.get(hoofdstuk).push({ nr, tekst: lichaam });
    }
  }

  return { meta, hoofdstukken };
}

function voegSamen(ruwe, label) {
  /** @type {Map<number, string[]>} */
  const delen = new Map();
  const volgorde = [];
  const samengevoegd = [];

  for (const vers of ruwe) {
    const match = /^(\d+)([a-z])?$/i.exec(vers.nr);
    if (!match) throw new Error(`Onbekend versnummer ${vers.nr} in ${label}`);
    const nummer = Number(match[1]);
    if (!delen.has(nummer)) {
      delen.set(nummer, []);
      volgorde.push(nummer);
    } else if (match[2]) {
      samengevoegd.push(`${nummer}${match[2].toLowerCase()}`);
    }
    delen.get(nummer).push(vers.tekst);
  }

  const nummers = [...volgorde].sort((a, b) => a - b);
  for (let i = 0; i < nummers.length; i += 1) {
    if (nummers[i] !== i + 1) {
      throw new Error(`Gat in ${label}: verwacht vers ${i + 1}, vond ${nummers[i]}`);
    }
  }

  return {
    verzen: nummers.map((nummer) => ({
      nr: nummer,
      tekst: delen.get(nummer).join(' ').replace(/\s+/g, ' ').trim(),
    })),
    samengevoegd,
  };
}

function unieke(lijst) {
  const gezien = new Set();
  const uit = [];
  for (const item of lijst) {
    const schoon = item.replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
    if (!schoon || isCorrupt(schoon)) continue;
    const sleutel = schoon.toLocaleLowerCase('nl');
    if (gezien.has(sleutel)) continue;
    gezien.add(sleutel);
    uit.push(schoon);
  }
  return uit;
}

function importeerMap(map) {
  const bestanden = readdirSync(map)
    .filter((naam) => naam.endsWith('.usfm'))
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  if (bestanden.length === 0) throw new Error(`Geen USFM in ${map}`);

  const boeken = [];
  const structuur = {};
  const samen = [];
  mkdirSync(doelMap, { recursive: true });

  for (const bestand of bestanden) {
    const ruw = readFileSync(join(map, bestand), 'utf8');
    const { meta, hoofdstukken } = leesUsfm(ruw, bestand);
    const def = perUsfm.get(meta.id);
    if (!def) throw new Error(`Onbekend USFM-id ${meta.id} in ${bestand}`);
    const [, id, testament, kort, extra] = def;
    const naam = !isCorrupt(meta.toc1) && meta.toc1 ? meta.toc1 : meta.h;
    if (!naam || isCorrupt(naam)) throw new Error(`Geen bruikbare boeknaam in ${bestand}`);

    const hoofdstukNrs = [...hoofdstukken.keys()].sort((a, b) => a - b);
    for (let i = 0; i < hoofdstukNrs.length; i += 1) {
      if (hoofdstukNrs[i] !== i + 1) {
        throw new Error(`Gat in hoofdstukken van ${naam}: ${hoofdstukNrs[i]}`);
      }
    }

    const hoofdstukData = [];
    const aantallen = [];
    for (const nr of hoofdstukNrs) {
      const { verzen, samengevoegd } = voegSamen(hoofdstukken.get(nr), `${id} ${nr}`);
      if (verzen.some((vers) => !vers.tekst)) {
        throw new Error(`Lege tekst in ${id} ${nr}`);
      }
      samen.push(...samengevoegd.map((item) => `${naam} ${nr}:${item}`));
      hoofdstukData.push({ nr, verzen });
      aantallen.push(verzen.length);
    }

    const boek = {
      boek: id,
      naam,
      testament,
      voorbeeld: false,
      bron: BRON_URL,
      hoofdstukken: hoofdstukData,
    };
    writeFileSync(join(doelMap, `${id}.json`), `${JSON.stringify(boek, null, 2)}\n`);
    structuur[id] = aantallen;
    boeken.push({
      id,
      naam,
      kort,
      testament,
      afkortingen: unieke([naam, meta.h, meta.toc2, ...extra]),
      hoofdstukken: hoofdstukNrs.length,
    });
  }

  if (boeken.length !== 66) throw new Error(`Verwacht 66 boeken, vond ${boeken.length}`);

  writeFileSync(join(wortel, 'data', 'boeken.json'), `${JSON.stringify(boeken, null, 2)}\n`);
  writeFileSync(
    join(wortel, 'data', 'versstructuur.json'),
    `${JSON.stringify(
      {
        bron: BRON_URL,
        systeem: 'nbg1951-ebible-nldnbg',
        opmerking:
          'Aantal verzen per hoofdstuk, geteld uit de USFM-bron. Geen bijbeltekst. Verzen die in de bron als 16a en 16b staan, tellen als één vers.',
        boeken: structuur,
      },
      null,
      2,
    )}\n`,
  );

  const verzen = Object.values(structuur).reduce((som, lijst) => som + lijst.reduce((a, b) => a + b, 0), 0);
  const bron = {
    vertaling: 'NBG 1951',
    status: 'opgenomen',
    opgehaaldOp: '2026-10-31',
    bronUrl: BRON_URL,
    bronPagina: 'https://ebible.org/Bible/details.php?id=nldnbg',
    leesPagina: 'https://ebible.org/nldnbg/',
    gitLab: 'https://gitlab.com/jtdaling/nbg-vertaling-1951',
    vermelding:
      'copyright © 2024 Jantinus Daling. Released under the GNU Free Documentation License. https://www.gnu.org/licenses/fdl-1.3.en.html',
    bevestigingBen: 'Ben bevestigde op 31-10-2026 dat de NBG 1951 op deze site gebruikt mag worden.',
    toelichting:
      'De verzen zijn letterlijk uit de USFM-bestanden van het eBible-zipbestand gehaald (bestanden gedateerd 30 oktober 2026 in de zip). Ze zijn niet overgetypt, aangevuld of uit het hoofd geschreven. Tussentitels (USFM-markering s1) zijn niet in de leestekst gezet. In de bron staat bij Deuteronomium een kapotte inhoudsregel (DeuteronoDeum); de getoonde naam komt uit de kopregel \\h Deuteronomium. De verzen van dat boek bevatten die fout niet.',
    samengevoegdeVerzen: samen,
    boeken: boeken.length,
    hoofdstukken: boeken.reduce((som, boek) => som + boek.hoofdstukken, 0),
    verzen,
  };
  writeFileSync(join(wortel, 'data', 'bron-tekst.json'), `${JSON.stringify(bron, null, 2)}\n`);
  console.log(`Klaar: ${boeken.length} boeken, ${bron.hoofdstukken} hoofdstukken, ${verzen} verzen.`);
  if (samen.length) console.log(`Samengevoegd (a/b): ${samen.join(', ')}`);
}

function pakUit(zip) {
  const doel = join(tmpdir(), `nbg-import-${Date.now()}`);
  mkdirSync(doel, { recursive: true });
  execFileSync('unzip', ['-q', '-o', zip, '-d', doel], { stdio: 'inherit' });
  return doel;
}

function importeerJson(pad) {
  const data = JSON.parse(readFileSync(pad, 'utf8'));
  if (!Array.isArray(data)) {
    throw new Error('JSON-invoer moet een array van verzen zijn, of gebruik een USFM-map.');
  }
  throw new Error(
    'Platte JSON-import is nog niet uitgewerkt. Gebruik een map met USFM, of bestanden die al data/bijbel/nbg1951/{id}.json zijn en kopieer die met de hand.',
  );
}

const invoer = process.argv[2];
if (!invoer) {
  console.error('Gebruik: node scripts/importeer-bijbel.mjs <usfm-map | zip | json>');
  process.exit(1);
}

if (invoer.endsWith('.zip')) {
  const map = pakUit(invoer);
  try {
    importeerMap(map);
  } finally {
    rmSync(map, { recursive: true, force: true });
  }
} else if (invoer.endsWith('.json')) {
  importeerJson(invoer);
} else {
  importeerMap(invoer);
}

console.log(`Bronbestand: ${basename(invoer)}`);
