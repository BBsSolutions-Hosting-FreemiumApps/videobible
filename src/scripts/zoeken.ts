import boekenJson from '../../data/boeken.json';
import structuurJson from '../../data/versstructuur.json';
import type { Bijbelboek, BoekInfo } from '../lib/types';
import { basis, padVanVerwijzing } from '../lib/paden';
import { parseVerwijzing } from '../lib/verwijzing-parser';

const boeken = boekenJson as BoekInfo[];
const verzen = (structuurJson as { boeken: Record<string, number[]> }).boeken;
const cache = new Map<string, Bijbelboek>();

function normaliseer(waarde: string) {
  return waarde.toLowerCase().normalize('NFD').replace(/\p{M}+/gu, '');
}

async function leesBoek(id: string): Promise<Bijbelboek | null> {
  if (cache.has(id)) return cache.get(id) ?? null;
  const antwoord = await fetch(`${basis()}data/bijbel/nbg1951/${id}.json`);
  if (!antwoord.ok) return null;
  const boek = (await antwoord.json()) as Bijbelboek;
  cache.set(id, boek);
  return boek;
}

function markeer(tekst: string, zoek: string) {
  const laag = normaliseer(tekst);
  const naald = normaliseer(zoek);
  const index = laag.indexOf(naald);
  const veilig = (stuk: string) => stuk.replace(/[&<>]/g, (teken) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[teken] || teken);
  if (index < 0) return veilig(tekst);
  return `${veilig(tekst.slice(0, index))}<mark>${veilig(tekst.slice(index, index + zoek.length))}</mark>${veilig(tekst.slice(index + zoek.length))}`;
}

async function zoek() {
  const params = new URLSearchParams(location.search);
  const q = (params.get('q') || '').trim();
  const veld = document.querySelector<HTMLInputElement>('#zoek-q');
  if (veld) veld.value = q;
  const leeg = document.querySelector<HTMLElement>('[data-zoek-leeg]');
  const geen = document.querySelector<HTMLElement>('[data-zoek-geen]');
  const lijst = document.querySelector<HTMLElement>('[data-zoek-lijst]');
  const aantal = document.querySelector('[data-zoek-aantal]');
  if (!q) {
    if (leeg) leeg.hidden = false;
    return;
  }
  const verwijzing = parseVerwijzing(q, boeken, verzen);
  if (verwijzing) {
    location.replace(padVanVerwijzing(verwijzing));
    return;
  }
  const boekFilter = params.get('boek') || document.querySelector<HTMLSelectElement>('[data-zoek-boek]')?.value || '';
  const testament = params.get('testament') || document.querySelector<HTMLSelectElement>('[data-zoek-testament]')?.value || '';
  const selectie = boeken.filter((boek) => {
    if (boekFilter && boek.id !== boekFilter) return false;
    if (testament === 'OT' || testament === 'NT') return boek.testament === testament;
    return true;
  });
  const hits: { html: string }[] = [];
  for (const boek of selectie) {
    const data = await leesBoek(boek.id);
    if (!data) continue;
    for (const hoofdstuk of data.hoofdstukken) {
      for (const vers of hoofdstuk.verzen) {
        if (!normaliseer(vers.tekst).includes(normaliseer(q))) continue;
        const href = padVanVerwijzing({ boek: boek.id, hoofdstuk: hoofdstuk.nr, van: vers.nr });
        hits.push({
          html: `<article class="resultaat"><a href="${href}">${boek.naam} ${hoofdstuk.nr}:${vers.nr}</a><p>${markeer(vers.tekst, q)}</p></article>`,
        });
        if (hits.length >= 40) break;
      }
      if (hits.length >= 40) break;
    }
    if (hits.length >= 40) break;
  }
  if (aantal) aantal.textContent = hits.length >= 40 ? '40 resultaten' : `${hits.length} ${hits.length === 1 ? 'resultaat' : 'resultaten'}`;
  if (lijst) {
    lijst.hidden = hits.length === 0;
    lijst.innerHTML = hits.map((hit) => hit.html).join('');
  }
  if (geen) geen.hidden = hits.length !== 0;
}

const form = document.querySelector<HTMLFormElement>('#zoekformulier');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new URLSearchParams(new FormData(form) as URLSearchParams);
  history.replaceState(null, '', `${location.pathname}?${data.toString()}`);
  void zoek();
});
void zoek();
