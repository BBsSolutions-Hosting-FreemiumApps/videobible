import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import boekenJson from '../../data/boeken.json';
import leesplannenJson from '../../data/leesplannen.json';
import videosJson from '../../data/videos.json';
import bronJson from '../../data/bron-tekst.json';
import type { Bijbelboek, BoekInfo, Leesplan, Video } from './types';

const dataMap = fileURLToPath(new URL('../../data/', import.meta.url));
const cache = new Map<string, Bijbelboek>();

export const boeken = boekenJson as BoekInfo[];
export const videos = videosJson as Video[];
export const leesplannen = leesplannenJson as Leesplan[];
export const bron = bronJson;

export function leesBijbelboek(id: string): Bijbelboek {
  const bestaand = cache.get(id);
  if (bestaand) return bestaand;
  const pad = `${dataMap}bijbel/nbg1951/${id}.json`;
  const boek = JSON.parse(readFileSync(pad, 'utf8')) as Bijbelboek;
  cache.set(id, boek);
  return boek;
}

export function boekOpId(id: string): BoekInfo | undefined {
  return boeken.find((boek) => boek.id === id);
}
