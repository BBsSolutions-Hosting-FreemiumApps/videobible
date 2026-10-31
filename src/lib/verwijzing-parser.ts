import type { BoekInfo, Verwijzing } from './types';

const indexCache = new WeakMap<BoekInfo[], Map<string, string>>();

/** Maakt een verwijzing vergelijkbaar: kleine letters, zonder accenten. */
export function normaliseer(invoer: string): string {
  return invoer
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .replace(/[.·]/g, ' ')
    .replace(/[‐‑‒–—―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function boekSleutel(naam: string): string {
  return normaliseer(naam).replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

export function bouwAliasIndex(boeken: BoekInfo[]): Map<string, string> {
  const bestaand = indexCache.get(boeken);
  if (bestaand) return bestaand;
  const index = new Map<string, string>();
  for (const boek of boeken) {
    for (const naam of [boek.naam, ...boek.afkortingen]) {
      const sleutel = boekSleutel(naam);
      if (!sleutel) continue;
      const vorige = index.get(sleutel);
      if (vorige && vorige !== boek.id) {
        throw new Error(`Alias botst: "${sleutel}" hoort bij ${vorige} en ${boek.id}`);
      }
      index.set(sleutel, boek.id);
    }
  }
  indexCache.set(boeken, index);
  return index;
}

const PATROON = /^(.+?)\s+(\d+)\s*(?::\s*(\d+)\s*(?:-\s*(\d+))?)?$/u;

/**
 * Herkent "Joh 3:16" en "Johannes 3:16-18".
 * Bij één vers zijn van en tot gelijk. Bij alleen een hoofdstuk zijn ze null.
 */
export function parseVerwijzing(
  invoer: string,
  boeken: BoekInfo[],
  verzenPerBoek: Record<string, number[]>,
): Verwijzing | null {
  if (!invoer?.trim()) return null;
  const match = PATROON.exec(normaliseer(invoer));
  if (!match) return null;

  const id = bouwAliasIndex(boeken).get(boekSleutel(match[1]));
  if (!id) return null;
  const boek = boeken.find((item) => item.id === id);
  if (!boek) return null;

  const hoofdstuk = Number(match[2]);
  if (!Number.isInteger(hoofdstuk) || hoofdstuk < 1 || hoofdstuk > boek.hoofdstukken) return null;
  const aantallen = verzenPerBoek[id];
  const maximum = aantallen?.[hoofdstuk - 1];
  if (!maximum) return null;
  if (!match[3]) return { boek: id, hoofdstuk, van: null, tot: null };

  const van = Number(match[3]);
  const tot = match[4] ? Number(match[4]) : van;
  if (!Number.isInteger(van) || !Number.isInteger(tot) || van < 1 || tot < van || tot > maximum) {
    return null;
  }
  return { boek: id, hoofdstuk, van, tot };
}

export function beschrijfVerwijzing(verwijzing: Verwijzing, boeken: BoekInfo[]): string {
  const naam = boeken.find((boek) => boek.id === verwijzing.boek)?.naam ?? verwijzing.boek;
  if (verwijzing.van == null) return `${naam} ${verwijzing.hoofdstuk}`;
  if (verwijzing.tot == null || verwijzing.tot === verwijzing.van) {
    return `${naam} ${verwijzing.hoofdstuk}:${verwijzing.van}`;
  }
  return `${naam} ${verwijzing.hoofdstuk}:${verwijzing.van}–${verwijzing.tot}`;
}
